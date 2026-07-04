// ============================================
// Project Progress Manager — Type Definitions
// ============================================

/**
 * Status of a tracked document.
 */
export type DocumentStatus = 'completed' | 'in-progress' | 'not-started';

/**
 * Represents a single tracked document in the project lifecycle.
 */
export interface DocumentInfo {
  /** Document number (01–24) */
  readonly number: number;
  /** Display name from CURRENT_STATUS.md */
  readonly name: string;
  /** Current status */
  status: DocumentStatus;
  /** Resolved file path on disk (null if not found) */
  filePath: string | null;
  /** Whether the file physically exists on disk */
  existsOnDisk: boolean;
}

/**
 * Progress percentage for a project phase.
 */
export interface PhaseProgress {
  /** Phase name (e.g., "Planning", "Architecture") */
  readonly name: string;
  /** Progress percentage (0–100) */
  percentage: number;
}

/**
 * Milestone tracking information.
 */
export interface MilestoneInfo {
  /** List of completed milestones */
  completed: string[];
  /** Current active milestone */
  current: string;
  /** Next upcoming milestone */
  next: string;
}

/**
 * A single architecture/project decision.
 */
export interface DecisionInfo {
  /** Decision number */
  readonly number: number;
  /** Decision description */
  readonly description: string;
  /** Decision status */
  readonly status: 'approved' | 'pending' | 'rejected';
}

/**
 * Git repository information.
 */
export interface GitInfo {
  /** Current branch name */
  branch: string;
  /** Last commit message */
  lastCommit: string;
  /** Last commit hash (short) */
  lastCommitHash: string;
  /** Last commit author */
  lastCommitAuthor: string;
  /** Last commit date */
  lastCommitDate: string;
  /** List of modified files */
  modifiedFiles: string[];
  /** Number of staged files */
  stagedCount: number;
  /** Number of unstaged changes */
  unstagedCount: number;
  /** Whether the repo is clean */
  isClean: boolean;
}

/**
 * Result of a single validation check.
 */
export interface ValidationResult {
  /** Validation category */
  readonly category: string;
  /** Check name */
  readonly check: string;
  /** Whether the check passed */
  passed: boolean;
  /** Descriptive message */
  message: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

/**
 * A single entry in the project timeline.
 */
export interface TimelineEntry {
  /** Phase this entry belongs to */
  readonly phase: string;
  /** Document or task name */
  readonly name: string;
  /** Current status */
  readonly status: DocumentStatus;
  /** Document number */
  readonly number: number;
}

/**
 * Full parsed state of CURRENT_STATUS.md.
 */
export interface ProjectState {
  /** Project name */
  projectName: string;
  /** Current phase name */
  currentPhase: string;
  /** Current document name */
  currentDocument: string;
  /** Current document status */
  currentDocumentStatus: string;
  /** All tracked documents */
  documents: DocumentInfo[];
  /** Phase progress data */
  phases: PhaseProgress[];
  /** Current task description */
  currentTask: string;
  /** Next task description */
  nextTask: string;
  /** Milestone information */
  milestones: MilestoneInfo;
  /** Recent approved decisions */
  recentDecisions: DecisionInfo[];
  /** Pending decisions */
  pendingDecisions: string[];
  /** Raw markdown content */
  rawContent: string;
}

/**
 * Aggregated project report data.
 */
export interface ProjectReport {
  /** Report generation timestamp */
  generatedAt: string;
  /** Project name */
  projectName: string;
  /** Current project state */
  state: ProjectState;
  /** Git information (null if unavailable) */
  git: GitInfo | null;
  /** Validation results */
  validations: ValidationResult[];
  /** Overall progress percentage */
  overallProgress: number;
  /** Recommendations for the team */
  recommendations: string[];
}

/**
 * Options for CLI commands.
 */
export interface CommandOptions {
  /** Suppress non-essential output */
  silent?: boolean;
  /** Skip confirmation prompts */
  force?: boolean;
  /** Output format */
  format?: 'text' | 'json';
}

/**
 * Configuration for a phase definition.
 */
export interface PhaseDefinition {
  /** Phase display name */
  readonly name: string;
  /** Document numbers that belong to this phase */
  readonly documentRange: readonly number[];
  /** Weight for overall progress calculation (0–1) */
  readonly weight: number;
}

/**
 * Scanned document result from the docs directory.
 */
export interface ScannedDocument {
  /** Extracted number prefix from filename */
  readonly number: number;
  /** Filename without path */
  readonly filename: string;
  /** Full file path */
  readonly filePath: string;
  /** Subdirectory within docs/ */
  readonly subdirectory: string;
  /** File size in bytes */
  readonly sizeBytes: number;
  /** Frontmatter data (if any) */
  readonly frontmatter: Record<string, unknown>;
  /** Whether the file has substantive content (> minimal threshold) */
  readonly hasContent: boolean;
}
