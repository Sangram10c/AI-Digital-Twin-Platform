// ============================================
// Project Progress Manager — Help Command
// ============================================

import chalk from 'chalk';
import Table from 'cli-table3';
import { CLI_COLORS } from '../constants/index.js';
import { createHeaderBox, createDivider } from '../utils/format-utils.js';

interface CommandDescription {
  command: string;
  script: string;
  description: string;
}

const COMMANDS: CommandDescription[] = [
  {
    command: 'status',
    script: 'npm run project:status',
    description: 'Show the project status dashboard with progress, documents, git info',
  },
  {
    command: 'update',
    script: 'npm run project:update',
    description: 'Scan docs, recalculate progress, and update CURRENT_STATUS.md',
  },
  {
    command: 'next',
    script: 'npm run project:next',
    description: 'Move focus to the next document (without completing current)',
  },
  {
    command: 'complete',
    script: 'npm run project:complete',
    description: 'Mark current document as completed and advance to next',
  },
  {
    command: 'validate',
    script: 'npm run project:validate',
    description: 'Check for missing docs, broken structure, missing configs',
  },
  {
    command: 'report',
    script: 'npm run project:report',
    description: 'Generate a comprehensive PROJECT_REPORT.md',
  },
  {
    command: 'timeline',
    script: 'npm run project:timeline',
    description: 'Show a visual timeline of all documents grouped by phase',
  },
  {
    command: 'help',
    script: 'npm run project:help',
    description: 'Show this help message',
  },
];

/**
 * Display all available commands with descriptions.
 */
export async function helpCommand(): Promise<void> {
  console.log();
  console.log(createHeaderBox('Project Progress Manager (PPM)', 'v1.0.0'));
  console.log();

  console.log(chalk.hex(CLI_COLORS.accent).bold('  📋 Available Commands'));
  console.log();

  const table = new Table({
    chars: {
      top: '─', 'top-mid': '┬', 'top-left': '  ┌', 'top-right': '┐',
      bottom: '─', 'bottom-mid': '┴', 'bottom-left': '  └', 'bottom-right': '┘',
      left: '  │', 'left-mid': '  ├', mid: '─', 'mid-mid': '┼',
      right: '│', 'right-mid': '┤', middle: '│',
    },
    head: [
      chalk.white.bold('Command'),
      chalk.white.bold('npm Script'),
      chalk.white.bold('Description'),
    ],
    colWidths: [12, 30, 55],
    style: { head: [], border: [] },
    wordWrap: true,
  });

  for (const cmd of COMMANDS) {
    table.push([
      chalk.hex(CLI_COLORS.primary).bold(cmd.command),
      chalk.hex(CLI_COLORS.info)(cmd.script),
      chalk.hex(CLI_COLORS.muted)(cmd.description),
    ]);
  }

  console.log(table.toString());
  console.log();

  // Usage examples
  console.log(chalk.hex(CLI_COLORS.accent).bold('  💡 Quick Start'));
  console.log();
  console.log(`  ${chalk.hex(CLI_COLORS.muted)('1.')} ${chalk.hex(CLI_COLORS.info)('npm run project:status')}     ${chalk.hex(CLI_COLORS.muted)('— See where you are')}`);
  console.log(`  ${chalk.hex(CLI_COLORS.muted)('2.')} ${chalk.hex(CLI_COLORS.info)('npm run project:complete')}   ${chalk.hex(CLI_COLORS.muted)('— Finish current doc')}`);
  console.log(`  ${chalk.hex(CLI_COLORS.muted)('3.')} ${chalk.hex(CLI_COLORS.info)('npm run project:report')}     ${chalk.hex(CLI_COLORS.muted)('— Generate a report')}`);
  console.log();

  console.log(createDivider(55));
  console.log(
    chalk.hex(CLI_COLORS.muted)('  Built for ') +
    chalk.hex(CLI_COLORS.header).bold('AI Engineering Intelligence Platform'),
  );
  console.log();
}
