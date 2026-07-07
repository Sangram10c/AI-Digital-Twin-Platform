// ============================================
// Project Progress Manager — Milestone Tracker Service
// ============================================

import type { DocumentInfo, MilestoneInfo } from '../types/index.js';

/**
 * Service responsible for tracking project milestones
 * derived from document completion state.
 */
export class MilestoneTrackerService {
  /**
   * Get all completed milestones from the document list.
   * Each completed document represents a milestone.
   */
  getCompletedMilestones(documents: DocumentInfo[]): string[] {
    return documents
      .filter((doc) => doc.status === 'completed')
      .map((doc) => `${doc.name} Documentation Completed`);
  }

  /**
   * Get the current milestone based on the in-progress document.
   */
  getCurrentMilestone(documents: DocumentInfo[]): string {
    const inProgress = documents.find((doc) => doc.status === 'in-progress');
    if (inProgress) {
      return `${inProgress.name} Documentation`;
    }

    const allCompleted = documents.every((doc) => doc.status === 'completed');
    if (allCompleted) {
      return 'All Documentation Complete';
    }

    const firstNotStarted = documents.find((doc) => doc.status === 'not-started');
    if (firstNotStarted) {
      return `${firstNotStarted.name} Documentation`;
    }

    return 'Unknown';
  }

  /**
   * Get the next milestone after the current one.
   */
  getNextMilestone(documents: DocumentInfo[]): string {
    const inProgress = documents.find((doc) => doc.status === 'in-progress');
    if (!inProgress) {
      const firstNotStarted = documents.find((doc) => doc.status === 'not-started');
      return firstNotStarted
        ? `${firstNotStarted.name} Approved`
        : 'Project Documentation Complete';
    }

    // Find the document after the in-progress one
    const currentIndex = documents.findIndex((doc) => doc.number === inProgress.number);
    for (let i = currentIndex + 1; i < documents.length; i++) {
      const doc = documents[i];
      if (doc && doc.status !== 'completed') {
        return `${doc.name} Approved`;
      }
    }

    return `${inProgress.name} Approved`;
  }

  /**
   * Build a complete MilestoneInfo object from documents.
   */
  buildMilestoneInfo(documents: DocumentInfo[]): MilestoneInfo {
    return {
      completed: this.getCompletedMilestones(documents),
      current: this.getCurrentMilestone(documents),
      next: this.getNextMilestone(documents),
    };
  }

  /**
   * Get milestone progress as a fraction string (e.g., "2/24").
   */
  getMilestoneProgress(documents: DocumentInfo[]): string {
    const completed = documents.filter((doc) => doc.status === 'completed').length;
    return `${completed}/${documents.length}`;
  }
}
