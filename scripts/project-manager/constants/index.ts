// ============================================
// Project Progress Manager — Constants
// ============================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PhaseDefinition } from '../types/index.js';

// ------------------------------------
// Path Resolution
// ------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root directory of the project (two levels up from constants/) */
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

/** Path to CURRENT_STATUS.md */
export const STATUS_FILE_PATH = path.join(PROJECT_ROOT, 'CURRENT_STATUS.md');

/** Path to the docs directory */
export const DOCS_DIR_PATH = path.join(PROJECT_ROOT, 'docs');

/** Path to PROJECT_REPORT.md output */
export const REPORT_FILE_PATH = path.join(PROJECT_ROOT, 'PROJECT_REPORT.md');

/** Path to README.md */
export const README_FILE_PATH = path.join(PROJECT_ROOT, 'README.md');

/** Path to AGENT.md */
export const AGENT_FILE_PATH = path.join(PROJECT_ROOT, 'AGENT.md');

// ------------------------------------
// Document Registry
// ------------------------------------

/**
 * Canonical ordered list of all 24 tracked documents.
 * Matches the table in CURRENT_STATUS.md exactly.
 */
export const DOCUMENT_REGISTRY: readonly { number: number; name: string }[] = [
  { number: 1, name: 'Project Overview' },
  { number: 2, name: 'User Journeys' },
  { number: 3, name: 'Functional Requirements' },
  { number: 4, name: 'Non-Functional Requirements' },
  { number: 5, name: 'System Architecture' },
  { number: 6, name: 'Technology Stack' },
  { number: 7, name: 'Database ERD' },
  { number: 8, name: 'Database Design' },
  { number: 9, name: 'API Design' },
  { number: 10, name: 'Authentication Design' },
  { number: 11, name: 'GitHub Integration' },
  { number: 12, name: 'AI / RAG Architecture' },
  { number: 13, name: 'Search Engine Design' },
  { number: 14, name: 'Background Job Architecture' },
  { number: 15, name: 'Security Architecture' },
  { number: 16, name: 'Frontend Architecture' },
  { number: 17, name: 'Backend Architecture' },
  { number: 18, name: 'Folder Structure' },
  { number: 19, name: 'Coding Standards' },
  { number: 20, name: 'Testing Strategy' },
  { number: 21, name: 'Deployment Architecture' },
  { number: 22, name: 'Development Roadmap' },
  { number: 23, name: 'Future Enhancements' },
  { number: 24, name: 'Glossary' },
] as const;

/** Total number of tracked documents */
export const TOTAL_DOCUMENTS = DOCUMENT_REGISTRY.length;

// ------------------------------------
// Phase Definitions
// ------------------------------------

/**
 * Phase definitions mapping document ranges to project phases.
 * Weights determine contribution to overall progress.
 */
export const PHASE_DEFINITIONS: readonly PhaseDefinition[] = [
  {
    name: 'Planning',
    documentRange: [1, 2, 3, 4],
    weight: 0.15,
  },
  {
    name: 'Architecture',
    documentRange: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    weight: 0.25,
  },
  {
    name: 'Backend',
    documentRange: [16, 17, 18, 19],
    weight: 0.20,
  },
  {
    name: 'Frontend',
    documentRange: [16, 18],
    weight: 0.15,
  },
  {
    name: 'Testing',
    documentRange: [20],
    weight: 0.10,
  },
  {
    name: 'Deployment',
    documentRange: [21, 22, 23, 24],
    weight: 0.15,
  },
] as const;

/** Ordered list of phase names */
export const PHASE_NAMES: readonly string[] = PHASE_DEFINITIONS.map((p) => p.name);

// ------------------------------------
// Status Icons & Labels
// ------------------------------------

export const STATUS_ICONS = {
  completed: '✅',
  'in-progress': '🟡',
  'not-started': '⬜',
} as const;

export const STATUS_LABELS = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  'not-started': 'Not Started',
} as const;

export const TIMELINE_ICONS = {
  completed: '✔',
  'in-progress': '→',
  'not-started': '○',
} as const;

// ------------------------------------
// CLI Colors (Hex values for Chalk)
// ------------------------------------

export const CLI_COLORS = {
  primary: '#6C63FF',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  muted: '#95A5A6',
  accent: '#E056FD',
  header: '#00D2D3',
  progressFilled: '#2ECC71',
  progressEmpty: '#4A4A4A',
  border: '#636E72',
} as const;

// ------------------------------------
// Progress Bar Configuration
// ------------------------------------

export const PROGRESS_BAR = {
  filledChar: '█',
  emptyChar: '░',
  defaultWidth: 30,
} as const;

// ------------------------------------
// Validation Configuration
// ------------------------------------

export const REQUIRED_ROOT_FILES = [
  'README.md',
  'AGENT.md',
  'CURRENT_STATUS.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'LICENSE',
  '.gitignore',
  '.prettierrc',
  '.editorconfig',
  'package.json',
] as const;

export const REQUIRED_CONFIG_FILES = [
  '.commitlintrc.json',
  '.lintstagedrc.js',
  'docker-compose.yml',
] as const;

// ------------------------------------
// Content Thresholds
// ------------------------------------

/** Minimum file size (bytes) to consider a document as having content */
export const MIN_CONTENT_SIZE_BYTES = 100;

/** Minimum number of lines to consider a document substantive */
export const MIN_CONTENT_LINES = 10;

// ------------------------------------
// Markdown Parsing Patterns
// ------------------------------------

export const MARKDOWN_PATTERNS = {
  /** Matches a markdown table row: | col1 | col2 | col3 | */
  tableRow: /^\|(.+)\|$/,
  /** Matches a table separator row: |---|---|---| */
  tableSeparator: /^\|[\s-:|]+\|$/,
  /** Matches a heading: # Heading */
  heading: /^(#{1,6})\s+(.+)$/,
  /** Matches status emoji in table cells */
  statusCompleted: /✅\s*Completed/,
  statusInProgress: /🟡\s*In Progress/,
  statusNotStarted: /⬜\s*Not Started/,
  /** Matches a numbered document file: 01-something.md */
  numberedFile: /^(\d{2})-(.+)\.md$/,
} as const;
