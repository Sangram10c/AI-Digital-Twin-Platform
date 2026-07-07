// ============================================
// Project Progress Manager — Markdown Parser
// ============================================

import { MARKDOWN_PATTERNS } from '../constants/index.js';
import type { DocumentStatus } from '../types/index.js';

/**
 * Represents a parsed table row with column values.
 */
export interface TableRow {
  /** Original line content */
  raw: string;
  /** Column values (trimmed) */
  columns: string[];
  /** Line number in the source file (0-indexed) */
  lineIndex: number;
}

/**
 * Represents a parsed markdown section.
 */
export interface MarkdownSection {
  /** Heading text */
  heading: string;
  /** Heading level (1–6) */
  level: number;
  /** Content lines between this heading and the next */
  content: string[];
  /** Start line index (0-indexed) */
  startLine: number;
  /** End line index (0-indexed, exclusive) */
  endLine: number;
}

/**
 * Parse a markdown table from content lines.
 * Returns an array of data rows (excludes header and separator rows).
 */
export function parseMarkdownTable(lines: string[], startIndex = 0): TableRow[] {
  const rows: TableRow[] = [];
  let headerFound = false;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]!.trim();

    if (!MARKDOWN_PATTERNS.tableRow.test(line)) {
      if (headerFound && rows.length > 0) {
        break; // End of table
      }
      continue;
    }

    if (MARKDOWN_PATTERNS.tableSeparator.test(line)) {
      headerFound = true;
      continue;
    }

    if (!headerFound) {
      // This is the header row; skip it but mark header found
      // (header row still matches tableRow pattern but comes before separator)
      continue;
    }

    const columns = line
      .slice(1, -1) // Remove leading and trailing |
      .split('|')
      .map((col) => col.trim());

    rows.push({
      raw: lines[i]!,
      columns,
      lineIndex: i,
    });
  }

  return rows;
}

/**
 * Update a specific cell in a markdown table.
 *
 * @param lines - All lines of the file
 * @param lineIndex - The line index of the row to update
 * @param columnIndex - The column index to update (0-based)
 * @param newValue - The new cell value
 * @returns Updated lines array
 */
export function updateTableCell(
  lines: string[],
  lineIndex: number,
  columnIndex: number,
  newValue: string,
): string[] {
  const updatedLines = [...lines];
  const line = updatedLines[lineIndex];
  if (!line) {
    return updatedLines;
  }

  const columns = line
    .slice(line.indexOf('|') + 1, line.lastIndexOf('|'))
    .split('|')
    .map((col) => col.trim());

  if (columnIndex >= 0 && columnIndex < columns.length) {
    columns[columnIndex] = ` ${newValue} `;
  }

  updatedLines[lineIndex] = `|${columns.join('|')}|`;
  return updatedLines;
}

/**
 * Find a section by heading text (case-insensitive partial match).
 */
export function findSection(lines: string[], headingSearch: string): MarkdownSection | null {
  const searchLower = headingSearch.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(MARKDOWN_PATTERNS.heading);
    if (!match) continue;

    const level = match[1]!.length;
    const heading = match[2]!.trim();

    if (!heading.toLowerCase().includes(searchLower)) continue;

    // Find the end of this section (next heading of same or higher level, or end of file)
    let endLine = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      const nextMatch = lines[j]!.match(MARKDOWN_PATTERNS.heading);
      if (nextMatch && nextMatch[1]!.length <= level) {
        endLine = j;
        break;
      }
    }

    return {
      heading,
      level,
      content: lines.slice(i + 1, endLine),
      startLine: i,
      endLine,
    };
  }

  return null;
}

/**
 * Replace content within a section, preserving the heading and surrounding content.
 */
export function replaceSection(
  lines: string[],
  headingSearch: string,
  newContent: string[],
): string[] {
  const section = findSection(lines, headingSearch);
  if (!section) return [...lines];

  const updatedLines = [...lines];
  // Remove old content (keep heading at startLine)
  updatedLines.splice(
    section.startLine + 1,
    section.endLine - section.startLine - 1,
    ...newContent,
  );
  return updatedLines;
}

/**
 * Parse the document status from a table cell string.
 */
export function parseDocumentStatus(cell: string): DocumentStatus {
  if (MARKDOWN_PATTERNS.statusCompleted.test(cell)) {
    return 'completed';
  }
  if (MARKDOWN_PATTERNS.statusInProgress.test(cell)) {
    return 'in-progress';
  }
  return 'not-started';
}

/**
 * Convert a DocumentStatus to its markdown representation.
 */
export function statusToMarkdown(status: DocumentStatus): string {
  switch (status) {
    case 'completed':
      return '✅ Completed';
    case 'in-progress':
      return '🟡 In Progress';
    case 'not-started':
      return '⬜ Not Started';
  }
}

/**
 * Find the line index of a section by searching for a heading pattern.
 */
export function findSectionLineIndex(lines: string[], headingSearch: string): number {
  const searchLower = headingSearch.toLowerCase();
  return lines.findIndex((line) => {
    const match = line.match(MARKDOWN_PATTERNS.heading);
    return match && match[2]!.trim().toLowerCase().includes(searchLower);
  });
}

/**
 * Extract text content from between two section headings.
 */
export function extractBetweenSections(
  lines: string[],
  startHeading: string,
  endHeading: string,
): string[] {
  const startIdx = findSectionLineIndex(lines, startHeading);
  if (startIdx === -1) return [];

  const endIdx = endHeading
    ? findSectionLineIndex(lines.slice(startIdx + 1), endHeading) + startIdx + 1
    : lines.length;

  if (endIdx <= startIdx) return lines.slice(startIdx + 1);

  return lines.slice(startIdx + 1, endIdx);
}
