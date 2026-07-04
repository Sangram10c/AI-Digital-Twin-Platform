#!/usr/bin/env node
// ============================================
// Project Progress Manager (PPM)
// ============================================
// CLI utility for managing the progress of
// AI Engineering Intelligence Platform
// ============================================

import { Command } from 'commander';
import { statusCommand } from './commands/status.command.js';
import { updateCommand } from './commands/update.command.js';
import { nextCommand } from './commands/next.command.js';
import { completeCommand } from './commands/complete.command.js';
import { validateCommand } from './commands/validate.command.js';
import { reportCommand } from './commands/report.command.js';
import { timelineCommand } from './commands/timeline.command.js';
import { helpCommand } from './commands/help.command.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('ppm')
  .description('Project Progress Manager — CLI for AI Engineering Intelligence Platform')
  .version('1.0.0');

// ── Status Command ──
program
  .command('status')
  .description('Show the project status dashboard')
  .action(async () => {
    await statusCommand();
  });

// ── Update Command ──
program
  .command('update')
  .description('Scan docs, recalculate progress, and update CURRENT_STATUS.md')
  .option('-s, --silent', 'Suppress non-essential output')
  .action(async (options: { silent?: boolean }) => {
    await updateCommand({ silent: options.silent });
  });

// ── Next Command ──
program
  .command('next')
  .description('Move to the next document')
  .action(async () => {
    await nextCommand();
  });

// ── Complete Command ──
program
  .command('complete')
  .description('Mark current document as completed and advance to next')
  .action(async () => {
    await completeCommand();
  });

// ── Validate Command ──
program
  .command('validate')
  .description('Run validation checks on project structure')
  .option('-s, --silent', 'Only report errors')
  .action(async (options: { silent?: boolean }) => {
    await validateCommand({ silent: options.silent });
  });

// ── Report Command ──
program
  .command('report')
  .description('Generate PROJECT_REPORT.md')
  .action(async () => {
    await reportCommand();
  });

// ── Timeline Command ──
program
  .command('timeline')
  .description('Show a visual project timeline')
  .action(async () => {
    await timelineCommand();
  });

// ── Help Command ──
program
  .command('help')
  .description('Show all available commands')
  .action(async () => {
    await helpCommand();
  });

// ── Error Handling ──
program.exitOverride();

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (error: unknown) {
    // Commander throws on --help and --version; ignore those
    if (error instanceof Error && 'code' in error) {
      const code = (error as Error & { code: string }).code;
      if (code === 'commander.helpDisplayed' || code === 'commander.version') {
        return;
      }
    }

    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('CURRENT_STATUS.md not found')) {
      logger.error('CURRENT_STATUS.md not found. Are you in the project root?');
    } else if (message.includes('ENOENT')) {
      logger.error(`File not found: ${message}`);
    } else if (message.includes('EACCES') || message.includes('EPERM')) {
      logger.error(`Permission denied: ${message}`);
    } else {
      logger.error(`Unexpected error: ${message}`);
    }

    process.exitCode = 1;
  }
}

main();
