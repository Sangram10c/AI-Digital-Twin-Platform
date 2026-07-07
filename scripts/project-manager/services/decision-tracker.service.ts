// ============================================
// Project Progress Manager — Decision Tracker Service
// ============================================

import type { DecisionInfo } from '../types/index.js';

/**
 * Service responsible for tracking architecture and project decisions.
 */
export class DecisionTrackerService {
  /**
   * Get approved decisions from the parsed data.
   */
  getRecentDecisions(decisions: DecisionInfo[]): DecisionInfo[] {
    return decisions.filter((d) => d.status === 'approved');
  }

  /**
   * Get the count of approved decisions.
   */
  getApprovedCount(decisions: DecisionInfo[]): number {
    return decisions.filter((d) => d.status === 'approved').length;
  }

  /**
   * Get pending decisions from the parsed data.
   */
  getPendingDecisions(pendingList: string[]): string[] {
    return [...pendingList];
  }

  /**
   * Get the count of pending decisions.
   */
  getPendingCount(pendingList: string[]): number {
    return pendingList.length;
  }

  /**
   * Format a decision for display.
   */
  formatDecision(decision: DecisionInfo): string {
    const statusIcon = decision.status === 'approved' ? '✅' : '⏳';
    return `${statusIcon} #${String(decision.number).padStart(3, '0')} — ${decision.description}`;
  }

  /**
   * Generate a new decision number based on existing decisions.
   */
  getNextDecisionNumber(decisions: DecisionInfo[]): number {
    if (decisions.length === 0) return 1;
    const maxNum = Math.max(...decisions.map((d) => d.number));
    return maxNum + 1;
  }

  /**
   * Create a markdown block for a new decision.
   */
  createDecisionMarkdown(
    number: number,
    description: string,
    status: 'approved' | 'pending',
  ): string {
    const statusText = status === 'approved' ? '✅ Approved' : '⏳ Pending';
    return [
      '',
      `## Decision #${String(number).padStart(3, '0')}`,
      '',
      description,
      '',
      'Status:',
      '',
      statusText,
      '',
      '---',
    ].join('\n');
  }
}
