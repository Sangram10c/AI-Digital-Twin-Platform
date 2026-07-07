// ============================================
// Project Progress Manager — Timeline Command
// ============================================

import ora from 'ora';
import chalk from 'chalk';
import { StatusParserService } from '../services/status-parser.service.js';
import { DocScannerService } from '../services/doc-scanner.service.js';
import { ProgressCalculatorService } from '../services/progress-calculator.service.js';
import { CLI_COLORS, PHASE_DEFINITIONS, TIMELINE_ICONS } from '../constants/index.js';
import { logger } from '../utils/logger.js';
import { createHeaderBox, createDivider, formatDocName } from '../utils/format-utils.js';
import type { DocumentInfo } from '../types/index.js';

/**
 * Display a visual timeline of completed, current, and upcoming work.
 */
export async function timelineCommand(): Promise<void> {
  const spinner = ora({
    text: 'Building project timeline...',
    spinner: 'dots',
  }).start();

  try {
    const statusParser = new StatusParserService();
    const docScanner = new DocScannerService();
    const progressCalculator = new ProgressCalculatorService();

    await statusParser.load();
    const state = await statusParser.parseCurrentStatus();
    state.documents = await docScanner.getFullDocumentMap(state.documents);

    spinner.stop();

    console.log();
    console.log(createHeaderBox('Project Timeline', state.projectName));
    console.log();

    // Group documents by phase
    for (const phaseDef of PHASE_DEFINITIONS) {
      const phaseDocs = state.documents.filter((doc) =>
        phaseDef.documentRange.includes(doc.number),
      );

      if (phaseDocs.length === 0) continue;

      const phaseProgress = progressCalculator
        .calculatePhaseProgress(state.documents)
        .find((p) => p.name === phaseDef.name);

      const progressText = phaseProgress ? `${phaseProgress.percentage}%` : '0%';

      // Phase header
      const phaseCompleted = phaseDocs.every((d) => d.status === 'completed');
      const phaseInProgress = phaseDocs.some((d) => d.status === 'in-progress');
      const phaseColor = phaseCompleted
        ? CLI_COLORS.success
        : phaseInProgress
          ? CLI_COLORS.warning
          : CLI_COLORS.muted;

      console.log(
        `  ${chalk.hex(phaseColor).bold(`◆ ${phaseDef.name}`)} ${chalk.hex(CLI_COLORS.muted)(`(${progressText})`)}`,
      );
      console.log(`  ${chalk.hex(CLI_COLORS.border)('│')}`);

      // Documents in this phase
      for (let i = 0; i < phaseDocs.length; i++) {
        const doc = phaseDocs[i]!;
        const isLast = i === phaseDocs.length - 1;
        const connector = isLast ? '└' : '├';

        const { icon, color } = getTimelineStyle(doc);

        console.log(
          `  ${chalk.hex(CLI_COLORS.border)(connector + '─')} ${chalk.hex(color)(icon)} ${chalk.hex(color)(formatDocName(doc.number, doc.name))}`,
        );
      }

      console.log();
    }

    // Summary
    console.log(createDivider(55));
    console.log();

    const completed = state.documents.filter((d) => d.status === 'completed').length;
    const total = state.documents.length;
    const overallProgress = progressCalculator.calculateOverallProgress(state.documents);

    console.log(
      `  ${chalk.hex(CLI_COLORS.success)(`${TIMELINE_ICONS.completed} Completed: ${completed}`)}  ${chalk.hex(CLI_COLORS.muted)('|')}  ` +
        `${chalk.hex(CLI_COLORS.warning)(`${TIMELINE_ICONS['in-progress']} In Progress: ${state.documents.filter((d) => d.status === 'in-progress').length}`)}  ${chalk.hex(CLI_COLORS.muted)('|')}  ` +
        `${chalk.hex(CLI_COLORS.muted)(`${TIMELINE_ICONS['not-started']} Remaining: ${total - completed - state.documents.filter((d) => d.status === 'in-progress').length}`)}`,
    );
    console.log(`  ${chalk.hex(CLI_COLORS.muted)(`Overall: ${overallProgress}%`)}`);
    console.log();
  } catch (error: unknown) {
    spinner.fail('Failed to build timeline');
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exitCode = 1;
  }
}

/**
 * Get the timeline icon and color for a document based on its status.
 */
function getTimelineStyle(doc: DocumentInfo): { icon: string; color: string } {
  switch (doc.status) {
    case 'completed':
      return { icon: TIMELINE_ICONS.completed, color: CLI_COLORS.success };
    case 'in-progress':
      return { icon: TIMELINE_ICONS['in-progress'], color: CLI_COLORS.warning };
    case 'not-started':
      return { icon: TIMELINE_ICONS['not-started'], color: CLI_COLORS.muted };
  }
}
