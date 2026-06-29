# XpressPro FX / NeXTrade — VPS Deployment Guide

Complete step-by-step instructions for deploying to a fresh Ubuntu 22.04 / 24.04 VPS.

---

## Prerequisites

- A VPS with at least 2 GB RAM, 20 GB disk, Ubuntu 22.04 LTS or 24.04 LTS
- A domain name pointed to the VPS IP (A record + optionally AAAA for IPv6)
- SSH access as `root` or a sudo user

---

## Step 1 — SSH into the server

```bash
ssh root@YOUR_SERVER_IP
# or if using a key:
ssh -i ~/.ssh/id_rsa root@YOUR_SERVER_IP
```

---

## Step 2 — Update the system

```bash
apt update && apt upgrade -y
apt install -y curl git build-essential
```

---

## Step 3 — Install Node.js 20 LTS via NodeSource

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # should print v20.x.x
npm -v    # should print 10.x.x
```

---

## Step 4 — Install PM2 globally

```bash
npm install -g pm2
pm2 -v    # confirm installed
```

---

## Step 5 — Install Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

---

## Step 6 — Install Certbot (Let's Encrypt SSL)

```bash
apt install -y certbot python3-certbot-nginx
```

---

## Step 7 — Clone the repository

```bash
cd /var/www
git clone https://github.com/alfredgrace904-ops/Rebranded-xpfx.git xpressfx
cd /var/www/xpressfx
```

---

## Step 8 — Configure environment variables

```bash
cp .env.example .env
nano .env
```

Fill in **every** variable below. All are required in production unless marked optional:

```
# REQUIRED
PORT=8080
NODE_ENV=production
SESSION_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))">
WALLET_ENCRYPTION_KEY=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# Admin portal credentials
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=<strong-password-min-16-chars>

# Database (required for persistence; without this data resets on restart)
DATABASE_URL=postgresql://user:password@host:5432/xpressfx

# CORS — set to your production domain(s), comma-separated full URLs
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# MoonPay (required for on-ramp/deposit flows)
MOONPAY_API_KEY=<from MoonPay dashboard>
MOONPAY_SECRET_KEY=<from MoonPay dashboard>
MOONPAY_WEBHOOK_SECRET=<from MoonPay webhook settings>

# Email (choose one provider)
# Option A — SendGrid (preferred)
SENDGRID_API_KEY=<from SendGrid dashboard>
# Option B — SMTP fallback
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@yourdomain.com
SMTP_PASS=<smtp-password>

# AI live-chat (optional — falls back to canned replies if not set)
AI_INTEGRATIONS_OPENAI_API_KEY=<OpenAI API key>
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# Blockchain providers (optional — falls back to ethers default public provider)
ALCHEMY_API_KEY=<from Alchemy dashboard>
INFURA_API_KEY=<from Infura dashboard>

# Notifications (optional)
ADMIN_NOTIFY_EMAIL=alerts@yourdomain.com

# Demo auth — set to false in production (disables /auth/demo endpoint)
ENABLE_DEMO_AUTH=false
```

---

## Step 9 — Install dependencies

```bash
cd /var/www/xpressfx
npm install --omit=dev
```

---

## Step 10 — Build all packages

```bash
npm run build:all
```

This builds (in order):
1. `@workspace/api-server` → `artifacts/api-server/dist/`
2. `@workspace/nextrade` → `artifacts/nextrade/dist/`
3. `@workspace/admin-portal` → `artifacts/admin-portal/dist/`

---

## Step 11 — Create log directory

```bash
mkdir -p /var/log/xpfx
chown -R www-data:www-data /var/log/xpfx 2>/dev/null || true
```

---

## Step 12 — Copy frontend build to web root

```bash
mkdir -p /var/www/xpressfx-static
cp -r artifacts/nextrade/dist/public/* /var/www/xpressfx-static/
```

---

## Step 13 — Start all services with PM2

```bash
cd /var/www/xpressfx
pm2 start ecosystem.config.js
pm2 status
pm2 logs xpressfx-api --lines 50
```

Verify the API is running:
```bash
curl http://localhost:8080/healthz
# Expected: {"status":"ok"}
```

---

## Step 14 — Configure Nginx

```bash
# Copy the config template
cp /var/www/xpressfx/nginx.conf /etc/nginx/sites-available/xpressfx

# Edit the config: replace yourdomain.com with your real domain
nano /etc/nginx/sites-available/xpressfx

# Also update the root path if you copied static files to /var/www/xpressfx-static
# Change:  root /var/www/xpressfx;
# To:      root /var/www/xpressfx-static;

# Enable the site
ln -s /etc/nginx/sites-available/xpressfx /etc/nginx/sites-enabled/

# Remove the default site if present
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## Step 15 — Obtain SSL certificate (Let's Encrypt)

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will:
- Verify domain ownership via HTTP challenge
- Obtain and install the certificate
- Auto-update the Nginx config with SSL paths
- Set up automatic renewal (cron/systemd timer)

Test renewal:
```bash
certbot renew --dry-run
```

---

## Step 16 — Persist PM2 across reboots

```bash
pm2 save
pm2 startup
# Run the command PM2 prints — it will look like:
# sudo env PATH=... pm2 startup systemd -u root --hp /root
```

---

## Step 17 — Final verification checklist

Run each check and confirm all pass before announcing the deployment:

```bash
# 1. API health
curl -sf https://yourdomain.com/api/healthz && echo "API OK"

# 2. Frontend loads
curl -sf https://yourdomain.com/ -o /dev/null -w "%{http_code}" && echo " frontend"

# 3. Admin portal loads
curl -sf https://yourdomain.com/xpadmin/ -o /dev/null -w "%{http_code}" && echo " admin"

# 4. SSL certificate active
curl -vI https://yourdomain.com 2>&1 | grep "SSL certificate verify ok"

# 5. No errors in PM2 logs
pm2 logs xpressfx-api --lines 100 --nostream | grep -i "error\|crash\|uncaught" || echo "No errors"

# 6. PM2 process is online
pm2 show xpressfx-api | grep "status.*online"

# 7. Nginx is running
systemctl is-active nginx

# 8. Auto-restart enabled (PM2 saved + startup configured)
pm2 list | grep xpressfx-api
```

---

## Maintenance

### Deploy an update

```bash
cd /var/www/xpressfx
git pull origin main
npm install --omit=dev
npm run build:all
cp -r artifacts/nextrade/dist/public/* /var/www/xpressfx-static/
pm2 reload ecosystem.config.js
```

### View live logs

```bash
pm2 logs xpressfx-api           # live tail
pm2 logs xpressfx-api --lines 200  # last 200 lines
tail -f /var/log/xpfx/api-error.log
```

### Rollback to a previous commit

```bash
cd /var/www/xpressfx
git log --oneline -10            # find the target commit hash
git checkout <commit-hash>
npm install --omit=dev
npm run build:all
pm2 reload ecosystem.config.js
```

### Rotate logs

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14
```
