// ============================================
// Project Progress Manager — Update Command
// ============================================

import ora from 'ora';
import { StatusParserService } from '../services/status-parser.service.js';
import { DocScannerService } from '../services/doc-scanner.service.js';
import { ProgressCalculatorService } from '../services/progress-calculator.service.js';
import { TaskDetectorService } from '../services/task-detector.service.js';
import { MilestoneTrackerService } from '../services/milestone-tracker.service.js';
import { logger } from '../utils/logger.js';
import type { CommandOptions } from '../types/index.js';

/**
 * Update CURRENT_STATUS.md by scanning docs and recalculating progress.
 */
export async function updateCommand(options: CommandOptions = {}): Promise<void> {
  const spinner = ora({
    text: 'Scanning project and updating status...',
    spinner: 'dots',
  }).start();

  try {
    // Initialize services
    const statusParser = new StatusParserService();
    const docScanner = new DocScannerService();
    const progressCalculator = new ProgressCalculatorService();
    const taskDetector = new TaskDetectorService();
    const milestoneTracker = new MilestoneTrackerService();

    // Parse current status
    await statusParser.load();
    const state = await statusParser.parseCurrentStatus();

    // Enrich with disk data
    state.documents = await docScanner.getFullDocumentMap(state.documents);

    // Write back auto-detected document statuses to CURRENT_STATUS.md
    for (const doc of state.documents) {
      await statusParser.updateDocumentStatus(doc.number, doc.status);
    }

    spinner.text = 'Recalculating progress...';

    // Recalculate phase progress
    const phases = progressCalculator.calculatePhaseProgress(state.documents);
    for (const phase of phases) {
      await statusParser.updatePhaseProgress(phase.name, phase.percentage);
    }

    // Detect current task
    const currentDoc = taskDetector.detectCurrentDocument(state.documents);

    if (currentDoc) {
      if (currentDoc.status === 'not-started') {
        currentDoc.status = 'in-progress';
        await statusParser.updateDocumentStatus(currentDoc.number, 'in-progress');
      }
      const paddedNum = String(currentDoc.number).padStart(2, '0');
      await statusParser.updateCurrentDocument(currentDoc.number, currentDoc.name);
      await statusParser.updateCurrentTask(
        `${paddedNum}-${currentDoc.name.toLowerCase().replace(/\s+/g, '-')}.md`,
      );
    }

    const nextDoc = taskDetector.detectNextDocument(state.documents);
    if (nextDoc) {
      const paddedNum = String(nextDoc.number).padStart(2, '0');
      await statusParser.updateNextTask(
        `${paddedNum}-${nextDoc.name.toLowerCase().replace(/\s+/g, '-')}.md`,
      );
    }

    // Update milestones
    const milestones = milestoneTracker.buildMilestoneInfo(state.documents);
    await statusParser.updateMilestones(milestones);

    spinner.text = 'Writing changes...';

    // Write back
    await statusParser.writeStatus();

    spinner.succeed('CURRENT_STATUS.md updated successfully');

    if (!options.silent) {
      logger.blank();

      // Show summary
      const overallProgress = progressCalculator.calculateOverallProgress(state.documents);
      logger.label('Overall Progress', `${overallProgress}%`);

      for (const phase of phases) {
        logger.label(`  ${phase.name}`, `${phase.percentage}%`);
      }

      if (currentDoc) {
        logger.blank();
        logger.label('Current Document', currentDoc.name);
      }
      if (nextDoc) {
        logger.label('Next Document', nextDoc.name);
      }

      logger.blank();
    }
  } catch (error: unknown) {
    spinner.fail('Failed to update status');
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exitCode = 1;
  }
}
