// ============================================
// Project Progress Manager — Report Generator Service
// ============================================

import { REPORT_FILE_PATH } from '../constants/index.js';
import type { ProjectState, GitInfo, ValidationResult, ProjectReport } from '../types/index.js';
import { writeFileContent } from '../utils/file-utils.js';
import { formatDate } from '../utils/format-utils.js';
import { generateReportMarkdown } from '../templates/report.template.js';

/**
 * Service responsible for generating PROJECT_REPORT.md
 * from aggregated project data.
 */
export class ReportGeneratorService {
  /**
   * Generate a complete project report.
   */
  generateReport(
    state: ProjectState,
    git: GitInfo | null,
    validations: ValidationResult[],
    overallProgress: number,
  ): ProjectReport {
    return {
      generatedAt: formatDate(),
      projectName: state.projectName,
      state,
      git,
      validations,
      overallProgress,
      recommendations: this.generateRecommendations(state, validations),
    };
  }

  /**
   * Write the report to PROJECT_REPORT.md.
   */
  async writeReport(report: ProjectReport): Promise<string> {
    const markdown = generateReportMarkdown(report);
    await writeFileContent(REPORT_FILE_PATH, markdown);
    return REPORT_FILE_PATH;
  }

  /**
   * Generate recommendations based on project state and validation results.
   */
  private generateRecommendations(state: ProjectState, validations: ValidationResult[]): string[] {
    const recommendations: string[] = [];

    // Check for failed validations
    const failedErrors = validations.filter((v) => !v.passed && v.severity === 'error');
    if (failedErrors.length > 0) {
      recommendations.push(
        `Fix ${failedErrors.length} critical validation error(s) before proceeding.`,
      );
    }

    // Check for completed docs without files on disk
    const completedWithoutFiles = state.documents.filter(
      (d) => d.status === 'completed' && !d.existsOnDisk,
    );
    if (completedWithoutFiles.length > 0) {
      recommendations.push(
        `${completedWithoutFiles.length} document(s) marked as completed but not found on disk. Verify file locations.`,
      );
    }

    // Check stale in-progress
    const inProgress = state.documents.filter((d) => d.status === 'in-progress');
    if (inProgress.length > 1) {
      recommendations.push(
        'Multiple documents are in-progress simultaneously. Focus on completing one at a time.',
      );
    }

    // Check pending decisions
    if (state.pendingDecisions.length > 5) {
      recommendations.push(
        `${state.pendingDecisions.length} pending decisions need resolution. Schedule a decision review.`,
      );
    }

    // Progress-based recommendations
    const completedCount = state.documents.filter((d) => d.status === 'completed').length;
    if (completedCount < 4) {
      recommendations.push(
        'Focus on completing the Planning phase documents before moving to Architecture.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Project is on track. Continue with the current document.');
    }

    return recommendations;
  }
}
