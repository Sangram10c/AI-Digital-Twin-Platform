// ============================================
// Project Progress Manager — Status Parser Service
// ============================================

import { STATUS_FILE_PATH, DOCUMENT_REGISTRY } from '../constants/index.js';
import type {
  DocumentInfo,
  DocumentStatus,
  PhaseProgress,
  MilestoneInfo,
  DecisionInfo,
  ProjectState,
} from '../types/index.js';
import { readFileContent, writeFileContent } from '../utils/file-utils.js';
import {
  parseMarkdownTable,
  findSection,
  parseDocumentStatus,
  statusToMarkdown,
  updateTableCell,
  findSectionLineIndex,
} from '../utils/markdown-parser.js';
import { logger } from '../utils/logger.js';

/**
 * Service responsible for parsing and updating CURRENT_STATUS.md.
 * This is the single source of truth for project state.
 */
export class StatusParserService {
  private content: string | null = null;
  private lines: string[] = [];

  private lineEnding = '\n';

  /**
   * Load the status file content into memory.
   */
  async load(): Promise<void> {
    this.content = await readFileContent(STATUS_FILE_PATH);
    if (this.content === null) {
      throw new Error(
        `CURRENT_STATUS.md not found at ${STATUS_FILE_PATH}. ` +
          'Ensure you are running from the project root.',
      );
    }
    // Detect line endings
    this.lineEnding = this.content.includes('\r\n') ? '\r\n' : '\n';
    this.lines = this.content.split(/\r?\n/);
  }

  /**
   * Parse the full project state from CURRENT_STATUS.md.
   */
  async parseCurrentStatus(): Promise<ProjectState> {
    if (this.content === null) {
      await this.load();
    }

    return {
      projectName: this.parseProjectName(),
      currentPhase: this.parseCurrentPhase(),
      currentDocument: this.parseCurrentDocument(),
      currentDocumentStatus: this.parseCurrentDocumentStatus(),
      documents: this.parseDocumentTable(),
      phases: this.parsePhaseProgress(),
      currentTask: this.parseCurrentTask(),
      nextTask: this.parseNextTask(),
      milestones: this.parseMilestones(),
      recentDecisions: this.parseRecentDecisions(),
      pendingDecisions: this.parsePendingDecisions(),
      rawContent: this.content!,
    };
  }

  /**
   * Parse the project name from the first heading.
   */
  parseProjectName(): string {
    for (const line of this.lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.replace(/^#\s+/, '').replace(/🚀\s*/, '').trim();
      }
    }
    return 'AI Engineering Intelligence Platform';
  }

  /**
   * Parse the current phase section.
   */
  parseCurrentPhase(): string {
    const section = findSection(this.lines, 'Current Phase');
    if (!section) return 'Unknown';

    for (const line of section.content) {
      const trimmed = line.trim();
      if (trimmed.startsWith('**Phase')) {
        const match = trimmed.match(/Phase\s+\d+\s*[—–-]\s*(.+)\*\*/);
        return match ? match[1]!.trim() : trimmed.replace(/\*\*/g, '').trim();
      }
    }
    return 'Planning & Architecture';
  }

  /**
   * Parse the current document name.
   */
  parseCurrentDocument(): string {
    const section = findSection(this.lines, 'Current Document');
    if (!section) return 'Unknown';

    for (const line of section.content) {
      const trimmed = line.trim();
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return trimmed
          .replace(/\*\*/g, '')
          .replace(/^\d+\s*[-–—]\s*/, '')
          .trim();
      }
    }
    return 'Unknown';
  }

  /**
   * Parse the current document status (e.g., "🟡 In Progress").
   */
  parseCurrentDocumentStatus(): string {
    const section = findSection(this.lines, 'Current Document');
    if (!section) return 'Unknown';

    for (const line of section.content) {
      const trimmed = line.trim();
      if (trimmed.includes('🟡') || trimmed.includes('✅') || trimmed.includes('⬜')) {
        return trimmed;
      }
    }
    return '🟡 In Progress';
  }

  /**
   * Parse the documentation progress table.
   */
  parseDocumentTable(): DocumentInfo[] {
    const section = findSection(this.lines, 'Documentation Progress');
    if (!section) return [];

    // Find the table within the section
    const sectionStart = section.startLine;
    const rows = parseMarkdownTable(this.lines, sectionStart);

    return rows.map((row) => {
      const numStr = row.columns[0]?.trim() ?? '0';
      const name = row.columns[1]?.trim() ?? 'Unknown';
      const statusStr = row.columns[2]?.trim() ?? '';
      const number = parseInt(numStr, 10);
      const status = parseDocumentStatus(statusStr);

      return {
        number,
        name,
        status,
        filePath: null,
        existsOnDisk: false,
      };
    });
  }

  /**
   * Parse the overall progress table.
   */
  parsePhaseProgress(): PhaseProgress[] {
    const section = findSection(this.lines, 'Overall Progress');
    if (!section) return [];

    const sectionStart = section.startLine;
    const rows = parseMarkdownTable(this.lines, sectionStart);

    return rows.map((row) => ({
      name: row.columns[0]?.trim() ?? 'Unknown',
      percentage: parseInt(row.columns[1]?.replace('%', '').trim() ?? '0', 10),
    }));
  }

  /**
   * Parse the current task section.
   */
  parseCurrentTask(): string {
    const section = findSection(this.lines, 'Current Task');
    if (!section) return 'Unknown';

    for (const line of section.content) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('Complete') && !trimmed.startsWith('---')) {
        return trimmed;
      }
    }
    return 'Unknown';
  }

  /**
   * Parse the next task section.
   */
  parseNextTask(): string {
    const section = findSection(this.lines, 'Next Task');
    if (!section) return 'Unknown';

    for (const line of section.content) {
      const trimmed = line.trim();
      if (trimmed.match(/^\d{2}-/)) {
        return trimmed;
      }
    }
    return 'Unknown';
  }

  /**
   * Parse milestone information.
   */
  parseMilestones(): MilestoneInfo {
    const section = findSection(this.lines, 'Last Updated');
    if (!section) {
      return { completed: [], current: 'Unknown', next: 'Unknown' };
    }

    const result: MilestoneInfo = {
      completed: [],
      current: 'Unknown',
      next: 'Unknown',
    };

    let mode: 'none' | 'current-milestone' | 'current-focus' | 'next-milestone' = 'none';

    for (const line of section.content) {
      const trimmed = line.trim();

      if (trimmed.includes('Current Milestone')) {
        mode = 'current-milestone';
        continue;
      }
      if (trimmed.includes('Current Focus')) {
        mode = 'current-focus';
        continue;
      }
      if (trimmed.includes('Next Milestone')) {
        mode = 'next-milestone';
        continue;
      }

      if (trimmed && mode === 'current-milestone') {
        if (trimmed.includes('✅')) {
          result.completed.push(trimmed.replace('✅', '').trim());
        }
        result.current = trimmed.replace(/[✅🟡⬜]/g, '').trim();
        mode = 'none';
      }
      if (trimmed && mode === 'current-focus') {
        result.current = trimmed.replace(/[✅🟡⬜]/g, '').trim();
        mode = 'none';
      }
      if (trimmed && mode === 'next-milestone') {
        result.next = trimmed;
        mode = 'none';
      }
    }

    return result;
  }

  /**
   * Parse recent decisions (approved).
   */
  parseRecentDecisions(): DecisionInfo[] {
    const section = findSection(this.lines, 'Recent Decisions');
    if (!section) return [];

    const decisions: DecisionInfo[] = [];
    let currentNum = 0;
    let currentDesc = '';

    for (const line of section.content) {
      const trimmed = line.trim();

      const decMatch = trimmed.match(/Decision\s*#(\d+)/);
      if (decMatch) {
        currentNum = parseInt(decMatch[1]!, 10);
        continue;
      }

      if (
        trimmed &&
        !trimmed.startsWith('Status') &&
        !trimmed.startsWith('---') &&
        !trimmed.startsWith('##') &&
        !trimmed.startsWith('✅') &&
        currentNum > 0 &&
        !currentDesc
      ) {
        currentDesc = trimmed;
        continue;
      }

      if (trimmed.includes('✅ Approved') && currentNum > 0) {
        decisions.push({
          number: currentNum,
          description: currentDesc,
          status: 'approved',
        });
        currentNum = 0;
        currentDesc = '';
      }
    }

    return decisions;
  }

  /**
   * Parse pending decisions.
   */
  parsePendingDecisions(): string[] {
    const section = findSection(this.lines, 'Pending Decisions');
    if (!section) return [];

    return section.content
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-'))
      .map((line) => line.replace(/^-\s*/, ''));
  }

  /**
   * Update a document's status in the documentation progress table.
   */
  async updateDocumentStatus(docNumber: number, newStatus: DocumentStatus): Promise<void> {
    if (this.content === null) await this.load();

    const section = findSection(this.lines, 'Documentation Progress');
    if (!section) {
      logger.error('Could not find Documentation Progress section');
      return;
    }

    const rows = parseMarkdownTable(this.lines, section.startLine);
    const targetRow = rows.find((r) => {
      const num = parseInt(r.columns[0]?.trim() ?? '0', 10);
      return num === docNumber;
    });

    if (!targetRow) {
      logger.error(`Document #${docNumber} not found in table`);
      return;
    }

    this.lines = updateTableCell(this.lines, targetRow.lineIndex, 2, statusToMarkdown(newStatus));
    this.content = this.lines.join('\n');
  }

  /**
   * Update a phase's progress percentage.
   */
  async updatePhaseProgress(phaseName: string, percentage: number): Promise<void> {
    if (this.content === null) await this.load();

    const section = findSection(this.lines, 'Overall Progress');
    if (!section) return;

    const rows = parseMarkdownTable(this.lines, section.startLine);
    const targetRow = rows.find((r) => {
      return r.columns[0]?.trim().toLowerCase() === phaseName.toLowerCase();
    });

    if (!targetRow) return;

    this.lines = updateTableCell(this.lines, targetRow.lineIndex, 1, `${Math.round(percentage)}%`);
    this.content = this.lines.join('\n');
  }

  /**
   * Update the "Current Document" section.
   */
  async updateCurrentDocument(docNumber: number, docName: string): Promise<void> {
    if (this.content === null) await this.load();

    const sectionIdx = findSectionLineIndex(this.lines, 'Current Document');
    if (sectionIdx === -1) return;

    // Find the bold line with the document name
    for (let i = sectionIdx + 1; i < Math.min(sectionIdx + 10, this.lines.length); i++) {
      const trimmed = this.lines[i]!.trim();
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        const paddedNum = String(docNumber).padStart(2, '0');
        this.lines[i] = `**${paddedNum} - ${docName}**`;
        break;
      }
    }

    this.content = this.lines.join('\n');
  }

  /**
   * Update the "Current Task" section.
   */
  async updateCurrentTask(taskText: string): Promise<void> {
    if (this.content === null) await this.load();

    const sectionIdx = findSectionLineIndex(this.lines, 'Current Task');
    if (sectionIdx === -1) return;

    for (let i = sectionIdx + 1; i < Math.min(sectionIdx + 10, this.lines.length); i++) {
      const trimmed = this.lines[i]!.trim();
      if (
        trimmed.match(/^\d{2}-/) ||
        (trimmed &&
          !trimmed.startsWith('Complete') &&
          !trimmed.startsWith('---') &&
          !trimmed.startsWith('#'))
      ) {
        this.lines[i] = taskText;
        break;
      }
    }

    this.content = this.lines.join('\n');
  }

  /**
   * Update the "Next Task" section.
   */
  async updateNextTask(taskText: string): Promise<void> {
    if (this.content === null) await this.load();

    const sectionIdx = findSectionLineIndex(this.lines, 'Next Task');
    if (sectionIdx === -1) return;

    for (let i = sectionIdx + 1; i < Math.min(sectionIdx + 10, this.lines.length); i++) {
      const trimmed = this.lines[i]!.trim();
      if (trimmed.match(/^\d{2}-/)) {
        this.lines[i] = taskText;
        break;
      }
    }

    this.content = this.lines.join('\n');
  }

  /**
   * Update the milestones section.
   */
  async updateMilestones(milestones: MilestoneInfo): Promise<void> {
    if (this.content === null) await this.load();

    const sectionIdx = findSectionLineIndex(this.lines, 'Last Updated');
    if (sectionIdx === -1) return;

    // Find and update the milestone lines
    for (let i = sectionIdx + 1; i < Math.min(sectionIdx + 20, this.lines.length); i++) {
      const trimmed = this.lines[i]!.trim();
      if (trimmed.includes('Current Milestone')) {
        // Update the line after "Current Milestone:"
        for (let j = i + 1; j < Math.min(i + 5, this.lines.length); j++) {
          if (this.lines[j]!.trim()) {
            this.lines[j] = `✅ ${milestones.current}`;
            break;
          }
        }
      }
      if (trimmed.includes('Current Focus')) {
        for (let j = i + 1; j < Math.min(i + 5, this.lines.length); j++) {
          if (this.lines[j]!.trim()) {
            this.lines[j] = `🟡 ${milestones.current}`;
            break;
          }
        }
      }
      if (trimmed.includes('Next Milestone')) {
        for (let j = i + 1; j < Math.min(i + 5, this.lines.length); j++) {
          if (this.lines[j]!.trim()) {
            this.lines[j] = milestones.next;
            break;
          }
        }
      }
    }

    this.content = this.lines.join('\n');
  }

  /**
   * Write the current in-memory state back to CURRENT_STATUS.md.
   */
  async writeStatus(): Promise<void> {
    if (this.content === null) {
      throw new Error('No content loaded. Call load() first.');
    }
    this.content = this.lines.join(this.lineEnding);
    await writeFileContent(STATUS_FILE_PATH, this.content, true);
  }

  /**
   * Get the raw lines array (for advanced operations).
   */
  getLines(): string[] {
    return [...this.lines];
  }
}
