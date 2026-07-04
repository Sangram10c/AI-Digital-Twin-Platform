// ============================================
// Project Progress Manager — Progress Calculator Service
// ============================================

import { PHASE_DEFINITIONS, TOTAL_DOCUMENTS } from '../constants/index.js';
import type { DocumentInfo, PhaseProgress, PhaseDefinition } from '../types/index.js';

/**
 * Service responsible for calculating progress percentages
 * for each phase and overall project.
 */
export class ProgressCalculatorService {
  /**
   * Calculate progress for each phase based on completed documents.
   */
  calculatePhaseProgress(documents: DocumentInfo[]): PhaseProgress[] {
    return PHASE_DEFINITIONS.map((phase) => ({
      name: phase.name,
      percentage: this.calculateSinglePhaseProgress(phase, documents),
    }));
  }

  /**
   * Calculate progress for a single phase.
   */
  private calculateSinglePhaseProgress(
    phase: PhaseDefinition,
    documents: DocumentInfo[],
  ): number {
    const phaseDocs = documents.filter((doc) =>
      phase.documentRange.includes(doc.number),
    );

    if (phaseDocs.length === 0) return 0;

    const completedCount = phaseDocs.filter((doc) => doc.status === 'completed').length;
    const inProgressCount = phaseDocs.filter((doc) => doc.status === 'in-progress').length;

    // In-progress docs count as 50% complete
    const effectiveCompleted = completedCount + inProgressCount * 0.5;
    return Math.round((effectiveCompleted / phaseDocs.length) * 100);
  }

  /**
   * Calculate the overall project progress as a weighted average.
   */
  calculateOverallProgress(documents: DocumentInfo[]): number {
    const completedCount = documents.filter((doc) => doc.status === 'completed').length;
    const inProgressCount = documents.filter((doc) => doc.status === 'in-progress').length;

    const effectiveCompleted = completedCount + inProgressCount * 0.5;
    return Math.round((effectiveCompleted / TOTAL_DOCUMENTS) * 100);
  }

  /**
   * Determine which phase a document belongs to.
   * Returns the first matching phase.
   */
  getPhaseForDocument(docNumber: number): string {
    for (const phase of PHASE_DEFINITIONS) {
      if (phase.documentRange.includes(docNumber)) {
        return phase.name;
      }
    }
    return 'Unknown';
  }

  /**
   * Get a summary of progress statistics.
   */
  getProgressSummary(documents: DocumentInfo[]): {
    totalDocuments: number;
    completedDocuments: number;
    inProgressDocuments: number;
    notStartedDocuments: number;
    overallPercentage: number;
  } {
    const completedDocuments = documents.filter((d) => d.status === 'completed').length;
    const inProgressDocuments = documents.filter((d) => d.status === 'in-progress').length;
    const notStartedDocuments = documents.filter((d) => d.status === 'not-started').length;

    return {
      totalDocuments: documents.length,
      completedDocuments,
      inProgressDocuments,
      notStartedDocuments,
      overallPercentage: this.calculateOverallProgress(documents),
    };
  }
}
