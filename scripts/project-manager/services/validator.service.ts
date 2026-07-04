// ============================================
// Project Progress Manager — Validator Service
// ============================================

import path from 'node:path';
import {
  PROJECT_ROOT,
  STATUS_FILE_PATH,
  DOCS_DIR_PATH,
  REQUIRED_ROOT_FILES,
  REQUIRED_CONFIG_FILES,
} from '../constants/index.js';
import type { ValidationResult, DocumentInfo } from '../types/index.js';
import { fileExists, readFileContent } from '../utils/file-utils.js';

/**
 * Service responsible for validating the project structure,
 * configuration files, and documentation integrity.
 */
export class ValidatorService {
  /**
   * Run all validation checks and return aggregated results.
   */
  async validateAll(documents: DocumentInfo[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    const checks = await Promise.all([
      this.checkStatusFileIntegrity(),
      this.checkRequiredRootFiles(),
      this.checkRequiredConfigs(),
      this.checkDocsDirectory(),
      this.checkMissingDocs(documents),
      this.checkAgentFile(),
      this.checkReadmeFile(),
    ]);

    for (const checkResults of checks) {
      results.push(...checkResults);
    }

    return results;
  }

  /**
   * Check CURRENT_STATUS.md integrity.
   */
  private async checkStatusFileIntegrity(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    const exists = await fileExists(STATUS_FILE_PATH);
    results.push({
      category: 'Status File',
      check: 'CURRENT_STATUS.md exists',
      passed: exists,
      message: exists
        ? 'CURRENT_STATUS.md found'
        : 'CURRENT_STATUS.md is missing — create it at project root',
      severity: 'error',
    });

    if (exists) {
      const content = await readFileContent(STATUS_FILE_PATH);
      const hasDocTable = content?.includes('Documentation Progress') ?? false;
      results.push({
        category: 'Status File',
        check: 'Documentation Progress table',
        passed: hasDocTable,
        message: hasDocTable
          ? 'Documentation Progress table found'
          : 'Documentation Progress table is missing from CURRENT_STATUS.md',
        severity: 'error',
      });

      const hasProgressTable = content?.includes('Overall Progress') ?? false;
      results.push({
        category: 'Status File',
        check: 'Overall Progress table',
        passed: hasProgressTable,
        message: hasProgressTable
          ? 'Overall Progress table found'
          : 'Overall Progress table is missing from CURRENT_STATUS.md',
        severity: 'error',
      });
    }

    return results;
  }

  /**
   * Check required root-level files.
   */
  private async checkRequiredRootFiles(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const file of REQUIRED_ROOT_FILES) {
      const filePath = path.join(PROJECT_ROOT, file);
      const exists = await fileExists(filePath);
      results.push({
        category: 'Root Files',
        check: file,
        passed: exists,
        message: exists ? `${file} found` : `${file} is missing`,
        severity: file === 'README.md' || file === 'package.json' ? 'error' : 'warning',
      });
    }

    return results;
  }

  /**
   * Check required configuration files.
   */
  private async checkRequiredConfigs(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const file of REQUIRED_CONFIG_FILES) {
      const filePath = path.join(PROJECT_ROOT, file);
      const exists = await fileExists(filePath);
      results.push({
        category: 'Configuration',
        check: file,
        passed: exists,
        message: exists ? `${file} found` : `${file} is missing`,
        severity: 'warning',
      });
    }

    return results;
  }

  /**
   * Check docs/ directory exists and has content.
   */
  private async checkDocsDirectory(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    const exists = await fileExists(DOCS_DIR_PATH);
    results.push({
      category: 'Documentation',
      check: 'docs/ directory',
      passed: exists,
      message: exists ? 'docs/ directory found' : 'docs/ directory is missing',
      severity: 'error',
    });

    return results;
  }

  /**
   * Check for documents listed in CURRENT_STATUS.md but not found on disk.
   */
  private async checkMissingDocs(documents: DocumentInfo[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    const completedOrInProgress = documents.filter(
      (doc) => doc.status === 'completed' || doc.status === 'in-progress',
    );

    for (const doc of completedOrInProgress) {
      const padded = String(doc.number).padStart(2, '0');
      results.push({
        category: 'Document Files',
        check: `${padded} — ${doc.name}`,
        passed: doc.existsOnDisk,
        message: doc.existsOnDisk
          ? `Document file found at ${doc.filePath ?? 'disk'}`
          : `Document marked as "${doc.status}" but file not found on disk`,
        severity: doc.status === 'completed' ? 'warning' : 'info',
      });
    }

    return results;
  }

  /**
   * Check AGENT.md exists.
   */
  private async checkAgentFile(): Promise<ValidationResult[]> {
    const filePath = path.join(PROJECT_ROOT, 'AGENT.md');
    const exists = await fileExists(filePath);
    return [{
      category: 'Agent Config',
      check: 'AGENT.md',
      passed: exists,
      message: exists ? 'AGENT.md found' : 'AGENT.md is missing — required for AI assistants',
      severity: 'warning',
    }];
  }

  /**
   * Check README.md exists and has content.
   */
  private async checkReadmeFile(): Promise<ValidationResult[]> {
    const filePath = path.join(PROJECT_ROOT, 'README.md');
    const content = await readFileContent(filePath);

    if (content === null) {
      return [{
        category: 'Documentation',
        check: 'README.md content',
        passed: false,
        message: 'README.md is missing or empty',
        severity: 'error',
      }];
    }

    const hasMinContent = content.length > 500;
    return [{
      category: 'Documentation',
      check: 'README.md content',
      passed: hasMinContent,
      message: hasMinContent
        ? 'README.md has substantive content'
        : 'README.md exists but appears minimal — consider expanding it',
      severity: 'info',
    }];
  }

  /**
   * Get a summary of validation results.
   */
  summarize(results: ValidationResult[]): {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    warnings: number;
  } {
    return {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      errors: results.filter((r) => !r.passed && r.severity === 'error').length,
      warnings: results.filter((r) => !r.passed && r.severity === 'warning').length,
    };
  }
}
