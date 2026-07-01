/**
 * Workspace Install Guard
 *
 * Prevents developers from running `npm install`, `npm ci`, or `npm add`
 * directly inside a workspace subdirectory (apps/frontend, apps/backend, etc.).
 *
 * In a monorepo, all dependency management must happen from the root directory
 * so that the unified lockfile and hoisted node_modules stay consistent.
 *
 * This script is invoked via the `preinstall` hook in each workspace package.json.
 */

const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const initCwd = process.env.INIT_CWD || process.cwd();
const normalizedRoot = path.normalize(rootDir);
const normalizedInit = path.normalize(initCwd);

// If the install was triggered from the monorepo root (or by the workspace engine), allow it.
if (normalizedInit === normalizedRoot) {
  process.exit(0);
}

// Otherwise, the user is running install directly inside a workspace — block it.
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

console.error('');
console.error(
  `${colors.bold}${colors.red}╔════════════════════════════════════════════════════════════════╗`,
);
console.error(`║                                                                ║`);
console.error(`║   ❌  BLOCKED: npm install inside a workspace directory!       ║`);
console.error(`║                                                                ║`);
console.error(`╠════════════════════════════════════════════════════════════════╣`);
console.error(`║                                                                ║`);
console.error(
  `║   This project uses ${colors.cyan}npm workspaces${colors.red}.                           ║`,
);
console.error(
  `║   Dependencies must be installed from the ${colors.yellow}monorepo root${colors.red}.      ║`,
);
console.error(`║                                                                ║`);
console.error(
  `║   ${colors.bold}${colors.cyan}Instead, run:${colors.red}                                            ║`,
);
console.error(`║                                                                ║`);
console.error(`║     ${colors.yellow}cd ${normalizedRoot}${colors.red}`);
console.error(
  `║     ${colors.yellow}npm install${colors.red}                                              ║`,
);
console.error(`║                                                                ║`);
console.error(
  `║   ${colors.bold}Safe commands inside workspaces:${colors.red}                             ║`,
);
console.error(
  `║     ${colors.cyan}npm run dev${colors.red}  |  ${colors.cyan}npm run build${colors.red}  |  ${colors.cyan}npm run test${colors.red}          ║`,
);
console.error(
  `║     ${colors.cyan}npm run lint${colors.red} |  ${colors.cyan}npm run start:dev${colors.red}                     ║`,
);
console.error(`║                                                                ║`);
console.error(`╚════════════════════════════════════════════════════════════════╝${colors.reset}`);
console.error('');

process.exit(1);
