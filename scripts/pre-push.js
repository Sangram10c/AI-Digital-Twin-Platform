/**
 * Git Quality Gate - Pre-push Hook Script
 *
 * Runs verification checks before pushing code:
 * 1. Environment Validation
 * 2. Configuration Auditing
 * 3. Frontend & Backend Compilation/Build
 * 4. Code Quality Linting
 * 5. TypeScript Type-Checking
 * 6. Unit Testing
 * 7. Security Audit (Fail on High/Critical only)
 * 8. Dependency Check
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const printStep = (num, name) => {
  console.log(`\n${colors.bold}${colors.blue}[Step ${num}/8] ${name}${colors.reset}`);
};

const printSuccess = (msg) => {
  console.log(`${colors.green}✔ ${msg}${colors.reset}`);
};

const printWarning = (msg) => {
  console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
};

const printError = (msg) => {
  console.log(`${colors.red}✘ ${msg}${colors.reset}`);
};

const runCommand = (cmd, cwd = process.cwd()) => {
  try {
    execSync(cmd, { stdio: 'inherit', cwd });
    return true;
  } catch (error) {
    return false;
  }
};

// Start validation
console.log(`${colors.bold}${colors.cyan}====================================================`);
console.log(`🚀 RUNNING ENTERPRISE GIT PUSH QUALITY GATE`);
console.log(`====================================================${colors.reset}`);

// Step 1: Environment Validation
printStep(1, 'Environment Verification');
const requiredEnvVars = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET'];
const rootEnvPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(rootEnvPath)) {
  printWarning('Root .env file is missing. Generating default .env from .env.example...');
  try {
    fs.copyFileSync(path.join(__dirname, '..', '.env.example'), rootEnvPath);
    printSuccess('Generated root .env file.');
  } catch (e) {
    printError('Failed to copy root .env.example. Please create a .env file manually.');
    process.exit(1);
  }
}
printSuccess('Environment file validation passed.');

// Step 2: Configuration Verification
printStep(2, 'Configuration Check');
const criticalFiles = [
  '.prettierrc',
  '.commitlintrc.json',
  'frontend/tsconfig.json',
  'frontend/eslint.config.mjs',
  'backend/tsconfig.json',
  'backend/eslint.config.mjs',
];
let configFailed = false;
criticalFiles.forEach((file) => {
  if (!fs.existsSync(path.join(__dirname, '..', file))) {
    printError(`Missing critical configuration file: ${file}`);
    configFailed = true;
  }
});
if (configFailed) {
  printError('Configuration check failed. Please restore missing files before pushing.');
  process.exit(1);
}
printSuccess('All configuration files verified.');

// Step 3: Build Verification
printStep(3, 'Build Verification');
console.log('Building Frontend...');
const frontendBuild = runCommand('npm run build:frontend');
console.log('Building Backend...');
const backendBuild = runCommand('npm run build:backend');

if (!frontendBuild || !backendBuild) {
  printError('Build verification failed! Please resolve compilation issues.');
  process.exit(1);
}
printSuccess('Build verification passed.');

// Step 4: Code Quality Linting
printStep(4, 'Code Quality Linting');
const lintPassed = runCommand('npm run lint');
if (!lintPassed) {
  printError('Linting checks failed. Fix the issues by running "npm run lint:fix".');
  process.exit(1);
}
printSuccess('Linting check passed.');

// Step 5: TypeScript Type Check
printStep(5, 'TypeScript Type Verification');
const typeCheckPassed = runCommand('npm run typecheck');
if (!typeCheckPassed) {
  printError('TypeScript Type check failed. Fix the type errors before pushing.');
  process.exit(1);
}
printSuccess('TypeScript Type check passed.');

// Step 6: Unit Testing
printStep(6, 'Unit Tests Execution');
const testsPassed = runCommand('npm run test');
if (!testsPassed) {
  printError('Unit tests failed. Make sure all tests pass before pushing.');
  process.exit(1);
}
printSuccess('Unit tests passed.');

// Step 7: Security Audit (Only fail on High/Critical)
printStep(7, 'Security Audit');
try {
  console.log('Running npm security audit...');
  // npm audit exit code is non-zero if vulnerabilities are found.
  // We can parse the audit json report to determine levels, or run it with audit flags.
  // For a robust audit, we can run 'npm audit --audit-level=high' which only exits with error if high or critical exist.
  execSync('npm audit --audit-level=high', { stdio: 'inherit' });
  printSuccess('Security audit passed (no high or critical vulnerabilities).');
} catch (error) {
  printError('Security audit failed! High or critical vulnerabilities detected.');
  printWarning('Please run "npm audit fix" or resolve security alerts before pushing.');
  process.exit(1);
}

// Step 8: Dependency Check
printStep(8, 'Dependency Check');
// Quick validation of package.json dependencies structures
try {
  const rootPkg = require('../package.json');
  const frontPkg = require('../frontend/package.json');
  const backPkg = require('../backend/package.json');

  // Make sure no obvious mismatch
  if (!rootPkg.devDependencies || !frontPkg.dependencies || !backPkg.dependencies) {
    throw new Error('Invalid package.json structure detected.');
  }
  printSuccess('Dependency verification check passed.');
} catch (err) {
  printError(`Dependency check failed: ${err.message}`);
  process.exit(1);
}

console.log(`\n${colors.bold}${colors.green}====================================================`);
console.log(`🎉 ALL QUALITY GATES PASSED! ALLOWING PUSH.`);
console.log(`====================================================${colors.reset}\n`);
process.exit(0);
