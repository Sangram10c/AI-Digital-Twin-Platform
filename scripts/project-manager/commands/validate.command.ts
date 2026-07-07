// ============================================
// Project Progress Manager — Validate Command
// ============================================

import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { StatusParserService } from '../services/status-parser.service.js';
import { DocScannerService } from '../services/doc-scanner.service.js';
import { ValidatorService } from '../services/validator.service.js';
import { CLI_COLORS } from '../constants/index.js';
import { logger } from '../utils/logger.js';
import { createSectionTitle } from '../utils/format-utils.js';
import type { CommandOptions } from '../types/index.js';

/**
 * Run all validation checks on the project structure.
 */
export async function validateCommand(options: CommandOptions = {}): Promise<void> {
  const spinner = ora({
    text: 'Running validation checks...',
    spinner: 'dots',
  }).start();

  try {
    const statusParser = new StatusParserService();
    const docScanner = new DocScannerService();
    const validator = new ValidatorService();

    await statusParser.load();
    const state = await statusParser.parseCurrentStatus();
    state.documents = await docScanner.getFullDocumentMap(state.documents);

    const results = await validator.validateAll(state.documents);
    const summary = validator.summarize(results);

    spinner.stop();

    if (options.silent) {
      // In silent mode, only report if there are errors
      if (summary.errors > 0) {
        logger.error(`${summary.errors} validation error(s) found`);
        process.exitCode = 1;
      }
      return;
    }

    // Full output
    console.log();
    console.log(createSectionTitle('🔍', 'Validation Results'));
    console.log();

    // Group by category
    const categories = [...new Set(results.map((r) => r.category))];

    for (const category of categories) {
      const categoryResults = results.filter((r) => r.category === category);

      console.log(`  ${chalk.hex(CLI_COLORS.accent).bold(category)}`);

      for (const result of categoryResults) {
        const icon = result.passed
          ? chalk.hex(CLI_COLORS.success)('✔')
          : result.severity === 'error'
            ? chalk.hex(CLI_COLORS.error)('✘')
            : result.severity === 'warning'
              ? chalk.hex(CLI_COLORS.warning)('⚠')
              : chalk.hex(CLI_COLORS.info)('ℹ');

        const checkName = result.passed
          ? chalk.hex(CLI_COLORS.success)(result.check)
          : result.severity === 'error'
            ? chalk.hex(CLI_COLORS.error)(result.check)
            : chalk.hex(CLI_COLORS.warning)(result.check);

        console.log(`    ${icon}  ${checkName}`);

        if (!result.passed) {
          console.log(`       ${chalk.hex(CLI_COLORS.muted)(result.message)}`);
        }
      }

      console.log();
    }

    // Summary table
    const summaryTable = new Table({
      chars: {
        top: '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        bottom: '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        left: '│',
        'left-mid': '├',
        mid: '─',
        'mid-mid': '┼',
        right: '│',
        'right-mid': '┤',
        middle: '│',
      },
      head: [
        chalk.white.bold('Total'),
        chalk.hex(CLI_COLORS.success).bold('Passed'),
        chalk.hex(CLI_COLORS.error).bold('Failed'),
        chalk.hex(CLI_COLORS.error).bold('Errors'),
        chalk.hex(CLI_COLORS.warning).bold('Warnings'),
      ],
      style: { head: [], border: [] },
    });

    summaryTable.push([
      chalk.white(String(summary.total)),
      chalk.hex(CLI_COLORS.success)(String(summary.passed)),
      chalk.hex(CLI_COLORS.error)(String(summary.failed)),
      chalk.hex(CLI_COLORS.error)(String(summary.errors)),
      chalk.hex(CLI_COLORS.warning)(String(summary.warnings)),
    ]);

    console.log(`  ${summaryTable.toString().split('\n').join('\n  ')}`);
    console.log();

    if (summary.errors > 0) {
      logger.error(`${summary.errors} critical error(s) require attention`);
      process.exitCode = 1;
    } else if (summary.warnings > 0) {
      logger.warn(`${summary.warnings} warning(s) found — review recommended`);
    } else {
      logger.success('All validation checks passed!');
    }

    console.log();
  } catch (error: unknown) {
    spinner.fail('Validation failed');
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exitCode = 1;
  }
}
