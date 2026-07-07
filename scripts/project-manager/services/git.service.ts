// ============================================
// Project Progress Manager — Git Service
// ============================================

import simpleGit, { type SimpleGit, type StatusResult, type LogResult } from 'simple-git';
import { PROJECT_ROOT } from '../constants/index.js';
import type { GitInfo } from '../types/index.js';

/**
 * Service responsible for Git integration using simple-git.
 */
export class GitService {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit(PROJECT_ROOT);
  }

  /**
   * Check if git is available and the directory is a git repository.
   */
  async isGitAvailable(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get comprehensive git repository information.
   */
  async getGitInfo(): Promise<GitInfo | null> {
    try {
      const isAvailable = await this.isGitAvailable();
      if (!isAvailable) return null;

      const [status, log, branch] = await Promise.all([
        this.git.status(),
        this.getRecentLog(1),
        this.getCurrentBranch(),
      ]);

      const lastLog = log.latest;

      return {
        branch,
        lastCommit: lastLog?.message ?? 'No commits',
        lastCommitHash: lastLog?.hash?.substring(0, 7) ?? '',
        lastCommitAuthor: lastLog?.author_name ?? '',
        lastCommitDate: lastLog?.date ?? '',
        modifiedFiles: this.extractModifiedFiles(status),
        stagedCount: status.staged.length,
        unstagedCount: status.modified.length + status.not_added.length,
        isClean: status.isClean(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Get the current branch name.
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const branchSummary = await this.git.branchLocal();
      return branchSummary.current;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get recent commits.
   */
  async getRecentLog(count = 5): Promise<LogResult> {
    return this.git.log({ maxCount: count });
  }

  /**
   * Get modified files in the docs/ directory.
   */
  async getModifiedDocFiles(): Promise<string[]> {
    try {
      const status = await this.git.status();
      const allModified = [...status.modified, ...status.not_added, ...status.created];
      return allModified.filter((f) => f.startsWith('docs/'));
    } catch {
      return [];
    }
  }

  /**
   * Get a list of recently changed files.
   */
  async getRecentlyChangedFiles(count = 10): Promise<string[]> {
    try {
      const log = await this.git.log({ maxCount: count });
      const files = new Set<string>();

      for (const commit of log.all) {
        const diff = await this.git
          .diff(['--name-only', `${commit.hash}~1`, commit.hash])
          .catch(() => '');
        const commitFiles = diff.split('\n').filter(Boolean);
        for (const file of commitFiles) {
          files.add(file);
        }
      }

      return [...files];
    } catch {
      return [];
    }
  }

  /**
   * Extract all modified file paths from a status result.
   */
  private extractModifiedFiles(status: StatusResult): string[] {
    return [
      ...status.modified,
      ...status.not_added,
      ...status.created,
      ...status.deleted,
      ...status.renamed.map((r) => r.to),
    ];
  }
}
