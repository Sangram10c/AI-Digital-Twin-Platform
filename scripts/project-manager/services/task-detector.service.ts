// ============================================
// Project Progress Manager — Task Detector Service
// ============================================

import { DOCUMENT_REGISTRY } from '../constants/index.js';
import type { DocumentInfo } from '../types/index.js';

/**
 * Service responsible for detecting the current and next task
 * based on document completion status.
 */
export class TaskDetectorService {
  /**
   * Detect the current document (first in-progress, or first not-started).
   */
  detectCurrentDocument(documents: DocumentInfo[]): DocumentInfo | null {
    // First priority: find an in-progress document
    const inProgress = documents.find((doc) => doc.status === 'in-progress');
    if (inProgress) return inProgress;

    // Second priority: find the first not-started document
    const notStarted = documents.find((doc) => doc.status === 'not-started');
    return notStarted ?? null;
  }

  /**
   * Detect the next document after the current one.
   */
  detectNextDocument(documents: DocumentInfo[]): DocumentInfo | null {
    const current = this.detectCurrentDocument(documents);
    if (!current) return null;

    const currentIndex = documents.findIndex((doc) => doc.number === current.number);
    if (currentIndex === -1 || currentIndex >= documents.length - 1) return null;

    // Find the next not-started document
    for (let i = currentIndex + 1; i < documents.length; i++) {
      const doc = documents[i];
      if (doc && doc.status !== 'completed') {
        return doc;
      }
    }

    return null;
  }

  /**
   * Detect the current phase based on the current document.
   */
  detectCurrentPhase(documents: DocumentInfo[]): string {
    const current = this.detectCurrentDocument(documents);
    if (!current) return 'Complete';

    if (current.number <= 4) return 'Planning & Architecture';
    if (current.number <= 15) return 'Architecture';
    if (current.number <= 19) return 'Development';
    if (current.number <= 20) return 'Testing';
    return 'Deployment';
  }

  /**
   * Advance to the next document: mark current as completed and return the next.
   */
  advanceToNext(documents: DocumentInfo[]): {
    completed: DocumentInfo | null;
    next: DocumentInfo | null;
  } {
    const current = this.detectCurrentDocument(documents);
    if (!current) return { completed: null, next: null };

    // Mark current as completed
    current.status = 'completed';

    // Find the next document
    const next = this.detectNextDocument(documents);
    if (next) {
      next.status = 'in-progress';
    }

    return { completed: current, next };
  }

  /**
   * Get the filename for a document based on its number and name.
   */
  getDocumentFilename(docNumber: number): string {
    const entry = DOCUMENT_REGISTRY.find((d) => d.number === docNumber);
    if (!entry) return `${String(docNumber).padStart(2, '0')}-unknown.md`;

    const slug = entry.name
      .toLowerCase()
      .replace(/[/\\]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    return `${String(docNumber).padStart(2, '0')}-${slug}.md`;
  }

  /**
   * Get a list of all completed documents.
   */
  getCompletedDocuments(documents: DocumentInfo[]): DocumentInfo[] {
    return documents.filter((doc) => doc.status === 'completed');
  }

  /**
   * Get a list of all remaining documents (not completed).
   */
  getRemainingDocuments(documents: DocumentInfo[]): DocumentInfo[] {
    return documents.filter((doc) => doc.status !== 'completed');
  }
}
