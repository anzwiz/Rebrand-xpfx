import app from "./app";
import { adminSeedStatus } from "./lib/store";
import { logger } from "./lib/logger";
import { startSweeper } from "./lib/sweeper";
import { assertRequiredEnv } from "./lib/env";
import { hydrateFromDb } from "./lib/hydrate";

const { port } = assertRequiredEnv();

if (adminSeedStatus.provisioned) {
  logger.info(
    { adminEmail: adminSeedStatus.email },
    "[admin] Admin account provisioned from environment.",
  );
} else {
  logger.warn(
    { reason: adminSeedStatus.reason },
    "[admin] No admin account provisioned. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables to enable admin login.",
  );
}

// --------------------------------------------------------------------------
// Crash guards
// --------------------------------------------------------------------------
// Without these, one unhandled promise rejection or thrown error anywhere
// in the app kills the entire Node process — the platform then shows the
// request as "crashed" and restarts the container, dropping in-flight requests.
//
// These handlers log the error with full context and keep the process
// alive for transient/recoverable errors (a failed fetch, a bad DB query
// that wasn't awaited correctly, etc). This is NOT a way to "fix" broken
// code — a bug that throws will keep throwing every time it's hit. What
// this buys you is that ONE bad request can't take down the whole server
// for every other user.
process.on("uncaughtException", (err) => {
  logger.error({ err: err.message, stack: err.stack }, "[crash-guard] uncaughtException — process kept alive");
});

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error({ err: err.message, stack: err.stack }, "[crash-guard] unhandledRejection — process kept alive");
});

// --------------------------------------------------------------------------
// Startup: hydrate then listen
// --------------------------------------------------------------------------
// Hydration must complete before the HTTP server opens so that the first
// request never sees an empty in-memory store. Errors are non-fatal — the
// server continues in in-memory-only mode (data lost on restart) rather than
// refusing to start entirely.
async function main() {
  try {
    await hydrateFromDb();
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    logger.error(
      { err: e.message },
      "[hydrate] Startup hydration failed — continuing in in-memory-only mode",
    );
  }

  const server = app.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
    startSweeper();
  });

  // --------------------------------------------------------------------------
  // Graceful shutdown
  // --------------------------------------------------------------------------
  // Platforms send SIGTERM before stopping/restarting a container (deploys,
  // scaling, healthcheck failures). Without handling it, in-flight requests
  // get cut off mid-response. This stops accepting new connections, lets
  // existing requests finish (up to a timeout), then exits cleanly.
  let shuttingDown = false;

  function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "[shutdown] received signal, closing gracefully");

    const forceExitTimer = setTimeout(() => {
      logger.warn("[shutdown] graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000);

    server.close((closeErr) => {
      clearTimeout(forceExitTimer);
      if (closeErr) {
        logger.error({ err: closeErr.message }, "[shutdown] error during close");
        process.exit(1);
      }
      logger.info("[shutdown] closed all connections, exiting cleanly");
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
