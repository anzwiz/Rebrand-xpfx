import { existsSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dateFnsDir = path.resolve(__dirname, '..', 'node_modules', 'date-fns');
const shimPath = path.join(dateFnsDir, 'max.mjs');

if (!existsSync(shimPath)) {
  writeFileSync(
    shimPath,
    ["import maxModule from './max.js';", '', 'export const max = maxModule.max;', 'export default maxModule.max;', ''].join('\n'),
    'utf8'
  );
  console.log('[fix-date-fns] created max.mjs shim for date-fns');
} else {
  console.log('[fix-date-fns] max.mjs already present');
}
