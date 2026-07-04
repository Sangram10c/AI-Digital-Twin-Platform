// ============================================
// Project Progress Manager — Format Utilities
// ============================================

import chalk from 'chalk';
import {
  CLI_COLORS,
  PROGRESS_BAR,
  TIMELINE_ICONS,
} from '../constants/index.js';
import type { DocumentStatus } from '../types/index.js';

/**
 * Create a colored terminal progress bar.
 *
 * @param percentage - Progress percentage (0–100)
 * @param width - Total bar width in characters
 * @returns Formatted progress bar string
 */
export function createProgressBar(percentage: number, width: number = PROGRESS_BAR.defaultWidth): string {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;

  const filledBar = chalk.hex(CLI_COLORS.progressFilled)(PROGRESS_BAR.filledChar.repeat(filled));
  const emptyBar = chalk.hex(CLI_COLORS.progressEmpty)(PROGRESS_BAR.emptyChar.repeat(empty));

  return `${filledBar}${emptyBar} ${formatPercentage(clamped)}`;
}

/**
 * Create a styled header box.
 */
export function createHeaderBox(title: string, subtitle?: string): string {
  const maxLen = Math.max(title.length, subtitle?.length ?? 0);
  const width = maxLen + 4;
  const border = chalk.hex(CLI_COLORS.border)('═'.repeat(width));
  const topBorder = chalk.hex(CLI_COLORS.border)('╔') + border + chalk.hex(CLI_COLORS.border)('╗');
  const bottomBorder = chalk.hex(CLI_COLORS.border)('╚') + border + chalk.hex(CLI_COLORS.border)('╝');

  const padTitle = title.padStart(Math.floor((width + title.length) / 2)).padEnd(width);
  const titleLine =
    chalk.hex(CLI_COLORS.border)('║') +
    ' ' +
    chalk.hex(CLI_COLORS.header).bold(padTitle) +
    ' ' +
    chalk.hex(CLI_COLORS.border)('║');

  const lines = [topBorder, titleLine];

  if (subtitle) {
    const padSub = subtitle.padStart(Math.floor((width + subtitle.length) / 2)).padEnd(width);
    const subLine =
      chalk.hex(CLI_COLORS.border)('║') +
      ' ' +
      chalk.hex(CLI_COLORS.muted)(padSub) +
      ' ' +
      chalk.hex(CLI_COLORS.border)('║');
    lines.push(subLine);
  }

  lines.push(bottomBorder);
  return lines.join('\n');
}

/**
 * Create a styled section divider.
 */
export function createDivider(width = 50): string {
  return chalk.hex(CLI_COLORS.border)('─'.repeat(width));
}

/**
 * Format a percentage with color coding.
 */
export function formatPercentage(value: number): string {
  const text = `${Math.round(value)}%`;
  if (value >= 80) return chalk.hex(CLI_COLORS.success).bold(text);
  if (value >= 40) return chalk.hex(CLI_COLORS.warning).bold(text);
  if (value > 0) return chalk.hex(CLI_COLORS.info).bold(text);
  return chalk.hex(CLI_COLORS.muted)(text);
}

/**
 * Format a document status with its corresponding icon.
 */
export function formatDocumentStatus(status: DocumentStatus): string {
  switch (status) {
    case 'completed':
      return chalk.hex(CLI_COLORS.success)(`${TIMELINE_ICONS.completed} Completed`);
    case 'in-progress':
      return chalk.hex(CLI_COLORS.warning)(`${TIMELINE_ICONS['in-progress']} In Progress`);
    case 'not-started':
      return chalk.hex(CLI_COLORS.muted)(`${TIMELINE_ICONS['not-started']} Not Started`);
  }
}

/**
 * Format a date string consistently.
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a document name for display with its number.
 */
export function formatDocName(number: number, name: string): string {
  const paddedNum = String(number).padStart(2, '0');
  return `${paddedNum} — ${name}`;
}

/**
 * Create a styled label: value pair.
 */
export function formatLabelValue(label: string, value: string): string {
  return `  ${chalk.hex(CLI_COLORS.muted)(label + ':')}  ${chalk.white.bold(value)}`;
}

/**
 * Pad a string to a fixed width for alignment.
 */
export function padRight(text: string, width: number): string {
  // Strip ANSI codes for accurate length calculation
  const stripped = text.replace(
    // eslint-disable-next-line no-control-regex
    /\u001b\[\d+(;\d+)*m/g,
    '',
  );
  const padding = Math.max(0, width - stripped.length);
  return text + ' '.repeat(padding);
}

/**
 * Create a section title with emoji.
 */
export function createSectionTitle(emoji: string, title: string): string {
  return chalk.hex(CLI_COLORS.accent).bold(`\n  ${emoji}  ${title}`);
}
