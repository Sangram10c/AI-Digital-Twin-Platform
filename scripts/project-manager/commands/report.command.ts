// ============================================
// Project Progress Manager — Report Command
// ============================================

import ora from 'ora';
import { StatusParserService } from '../services/status-parser.service.js';
import { DocScannerService } from '../services/doc-scanner.service.js';
import { ProgressCalculatorService } from '../services/progress-calculator.service.js';
import { GitService } from '../services/git.service.js';
import { ValidatorService } from '../services/validator.service.js';
import { ReportGeneratorService } from '../services/report-generator.service.js';
import { MilestoneTrackerService } from '../services/milestone-tracker.service.js';
import { logger } from '../utils/logger.js';

/**
 * Generate PROJECT_REPORT.md with comprehensive project data.
 */
export async function reportCommand(): Promise<void> {
  const spinner = ora({
    text: 'Generating project report...',
    spinner: 'dots',
  }).start();

  try {
    const statusParser = new StatusParserService();
    const docScanner = new DocScannerService();
    const progressCalculator = new ProgressCalculatorService();
    const gitService = new GitService();
    const validator = new ValidatorService();
    const reportGenerator = new ReportGeneratorService();
    const milestoneTracker = new MilestoneTrackerService();

    // Gather all data
    spinner.text = 'Parsing project status...';
    await statusParser.load();
    const state = await statusParser.parseCurrentStatus();
    state.documents = await docScanner.getFullDocumentMap(state.documents);

    // Recalculate
    state.phases = progressCalculator.calculatePhaseProgress(state.documents);
    state.milestones = milestoneTracker.buildMilestoneInfo(state.documents);
    const overallProgress = progressCalculator.calculateOverallProgress(state.documents);

    spinner.text = 'Fetching git information...';
    const git = await gitService.getGitInfo();

    spinner.text = 'Running validations...';
    const validations = await validator.validateAll(state.documents);

    spinner.text = 'Generating report...';
    const report = reportGenerator.generateReport(state, git, validations, overallProgress);

    const outputPath = await reportGenerator.writeReport(report);

    spinner.succeed('Project report generated!');

    logger.blank();
    logger.label('Output', outputPath);
    logger.label('Progress', `${overallProgress}%`);
    logger.label(
      'Validations',
      `${validations.filter((v) => v.passed).length}/${validations.length} passed`,
    );
    logger.blank();
  } catch (error: unknown) {
    spinner.fail('Failed to generate report');
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exitCode = 1;
  }
}
