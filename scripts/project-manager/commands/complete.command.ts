// ============================================
// Project Progress Manager — Complete Command
// ============================================

import ora from 'ora';
import chalk from 'chalk';
import { StatusParserService } from '../services/status-parser.service.js';
import { DocScannerService } from '../services/doc-scanner.service.js';
import { ProgressCalculatorService } from '../services/progress-calculator.service.js';
import { TaskDetectorService } from '../services/task-detector.service.js';
import { MilestoneTrackerService } from '../services/milestone-tracker.service.js';
import { CLI_COLORS } from '../constants/index.js';
import { logger } from '../utils/logger.js';
import { formatDocName, createProgressBar } from '../utils/format-utils.js';

/**
 * Mark the current document as completed and advance to the next.
 */
export async function completeCommand(): Promise<void> {
  const spinner = ora({
    text: 'Completing current document...',
    spinner: 'dots',
  }).start();

  try {
    const statusParser = new StatusParserService();
    const docScanner = new DocScannerService();
    const progressCalculator = new ProgressCalculatorService();
    const taskDetector = new TaskDetectorService();
    const milestoneTracker = new MilestoneTrackerService();

    await statusParser.load();
    const state = await statusParser.parseCurrentStatus();
    state.documents = await docScanner.getFullDocumentMap(state.documents);

    const currentDoc = taskDetector.detectCurrentDocument(state.documents);
    if (!currentDoc) {
      spinner.info('No in-progress document to complete');
      return;
    }

    spinner.text = `Completing: ${currentDoc.name}...`;

    // Mark current as completed
    await statusParser.updateDocumentStatus(currentDoc.number, 'completed');
    currentDoc.status = 'completed';

    // Find and activate next document (the one immediately after the completed doc)
    const completedIndex = state.documents.findIndex((d) => d.number === currentDoc.number);
    const nextDoc = state.documents.find(
      (d, i) => i > completedIndex && d.status === 'not-started',
    );
    if (nextDoc) {
      await statusParser.updateDocumentStatus(nextDoc.number, 'in-progress');
      nextDoc.status = 'in-progress';

      await statusParser.updateCurrentDocument(nextDoc.number, nextDoc.name);
      const paddedNum = String(nextDoc.number).padStart(2, '0');
      await statusParser.updateCurrentTask(`${paddedNum}-${nextDoc.name.toLowerCase().replace(/\s+/g, '-')}.md`);

      // Find what comes after next
      const nextNextDoc = state.documents.find(
        (d) => d.number > nextDoc.number && d.status === 'not-started',
      );
      if (nextNextDoc) {
        const nextPadded = String(nextNextDoc.number).padStart(2, '0');
        await statusParser.updateNextTask(`${nextPadded}-${nextNextDoc.name.toLowerCase().replace(/\s+/g, '-')}.md`);
      }
    }

    // Recalculate progress
    const phases = progressCalculator.calculatePhaseProgress(state.documents);
    for (const phase of phases) {
      await statusParser.updatePhaseProgress(phase.name, phase.percentage);
    }

    // Update milestones
    const milestones = milestoneTracker.buildMilestoneInfo(state.documents);
    await statusParser.updateMilestones(milestones);

    // Write back
    await statusParser.writeStatus();

    spinner.succeed('Document completed!');

    // Display summary
    logger.blank();
    console.log(
      `  ${chalk.hex(CLI_COLORS.success)('✔')} ${chalk.hex(CLI_COLORS.success).bold('Completed:')}  ${chalk.hex(CLI_COLORS.success)(formatDocName(currentDoc.number, currentDoc.name))}`,
    );

    if (nextDoc) {
      console.log(
        `  ${chalk.hex(CLI_COLORS.warning)('→')} ${chalk.hex(CLI_COLORS.warning).bold('Next:')}       ${chalk.hex(CLI_COLORS.warning)(formatDocName(nextDoc.number, nextDoc.name))}`,
      );
    } else {
      console.log(
        `  ${chalk.hex(CLI_COLORS.success)('🎉')} ${chalk.hex(CLI_COLORS.success).bold('All documents completed!')}`,
      );
    }

    logger.blank();

    const overallProgress = progressCalculator.calculateOverallProgress(state.documents);
    console.log(`  ${chalk.hex(CLI_COLORS.muted)('Progress:')} ${createProgressBar(overallProgress, 30)}`);
    logger.blank();
  } catch (error: unknown) {
    spinner.fail('Failed to complete document');
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exitCode = 1;
  }
}
