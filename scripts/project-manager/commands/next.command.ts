// ============================================
// Project Progress Manager — Next Command
// ============================================

import ora from 'ora';
import chalk from 'chalk';
import { StatusParserService } from '../services/status-parser.service.js';
import { DocScannerService } from '../services/doc-scanner.service.js';
import { TaskDetectorService } from '../services/task-detector.service.js';
import { CLI_COLORS } from '../constants/index.js';
import { logger } from '../utils/logger.js';
import { formatDocName } from '../utils/format-utils.js';

/**
 * Move to the next document without marking current as complete.
 */
export async function nextCommand(): Promise<void> {
  const spinner = ora({
    text: 'Detecting next document...',
    spinner: 'dots',
  }).start();

  try {
    const statusParser = new StatusParserService();
    const docScanner = new DocScannerService();
    const taskDetector = new TaskDetectorService();

    await statusParser.load();
    const state = await statusParser.parseCurrentStatus();
    state.documents = await docScanner.getFullDocumentMap(state.documents);

    const currentDoc = taskDetector.detectCurrentDocument(state.documents);
    const nextDoc = taskDetector.detectNextDocument(state.documents);

    if (!nextDoc) {
      spinner.info('No next document found — all documents may be completed');
      return;
    }

    // Update next document to in-progress
    await statusParser.updateDocumentStatus(nextDoc.number, 'in-progress');
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

    await statusParser.writeStatus();

    spinner.succeed('Moved to next document');

    logger.blank();
    if (currentDoc) {
      console.log(
        `  ${chalk.hex(CLI_COLORS.muted)('From:')}  ${chalk.hex(CLI_COLORS.muted)(formatDocName(currentDoc.number, currentDoc.name))}`,
      );
    }
    console.log(
      `  ${chalk.hex(CLI_COLORS.success)('To:')}    ${chalk.hex(CLI_COLORS.success).bold(formatDocName(nextDoc.number, nextDoc.name))}`,
    );
    logger.blank();
  } catch (error: unknown) {
    spinner.fail('Failed to move to next document');
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exitCode = 1;
  }
}
