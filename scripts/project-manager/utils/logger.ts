// ============================================
// Project Progress Manager — Logger Utility
// ============================================

import chalk from 'chalk';
import { CLI_COLORS } from '../constants/index.js';

/**
 * Centralized logging utility with consistent formatting and coloring.
 */
export const logger = {
  /**
   * Log an informational message.
   */
  info(message: string): void {
    console.log(chalk.hex(CLI_COLORS.info)('ℹ'), chalk.hex(CLI_COLORS.info)(message));
  },

  /**
   * Log a success message.
   */
  success(message: string): void {
    console.log(chalk.hex(CLI_COLORS.success)('✔'), chalk.hex(CLI_COLORS.success)(message));
  },

  /**
   * Log a warning message.
   */
  warn(message: string): void {
    console.log(chalk.hex(CLI_COLORS.warning)('⚠'), chalk.hex(CLI_COLORS.warning)(message));
  },

  /**
   * Log an error message.
   */
  error(message: string): void {
    console.log(chalk.hex(CLI_COLORS.error)('✘'), chalk.hex(CLI_COLORS.error)(message));
  },

  /**
   * Log a muted/debug message.
   */
  muted(message: string): void {
    console.log(chalk.hex(CLI_COLORS.muted)(message));
  },

  /**
   * Log a blank line for spacing.
   */
  blank(): void {
    console.log();
  },

  /**
   * Log a styled header line.
   */
  header(message: string): void {
    console.log(chalk.hex(CLI_COLORS.header).bold(message));
  },

  /**
   * Log a labeled value pair.
   */
  label(label: string, value: string): void {
    console.log(chalk.hex(CLI_COLORS.muted)(label + ':'), chalk.white.bold(value));
  },
} as const;
