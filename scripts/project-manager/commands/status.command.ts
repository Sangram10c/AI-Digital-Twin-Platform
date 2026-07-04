// ============================================
// Project Progress Manager — Status Command
// ============================================

import ora from 'ora';
import { StatusParserService } from '../services/status-parser.service.js';
import { DocScannerService } from '../services/doc-scanner.service.js';
import { ProgressCalculatorService } from '../services/progress-calculator.service.js';
import { GitService } from '../services/git.service.js';
import { MilestoneTrackerService } from '../services/milestone-tracker.service.js';
import { renderDashboard } from '../templates/status.template.js';
import { logger } from '../utils/logger.js';

/**
 * Display the project status dashboard.
 */
export async function statusCommand(): Promise<void> {
  const spinner = ora({
    text: 'Loading project status...',
    spinner: 'dots',
  }).start();

  try {
    // Initialize services
    const statusParser = new StatusParserService();
    const docScanner = new DocScannerService();
    const progressCalculator = new ProgressCalculatorService();
    const gitService = new GitService();
    const milestoneTracker = new MilestoneTrackerService();

    // Parse current status
    const state = await statusParser.parseCurrentStatus();

    // Enrich with disk data
    state.documents = await docScanner.getFullDocumentMap(state.documents);

    // Recalculate progress
    const phases = progressCalculator.calculatePhaseProgress(state.documents);
    state.phases = phases;

    // Recalculate milestones
    state.milestones = milestoneTracker.buildMilestoneInfo(state.documents);

    // Get overall progress
    const overallProgress = progressCalculator.calculateOverallProgress(state.documents);

    // Get git info
    const git = await gitService.getGitInfo();

    spinner.stop();

    // Render dashboard
    renderDashboard(state, git, overallProgress);
  } catch (error: unknown) {
    spinner.fail('Failed to load project status');
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);
    process.exitCode = 1;
  }
}
