// ============================================
// Project Progress Manager — File Utilities
// ============================================

import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'node:path';

/**
 * Safely read a file's content. Returns null if file does not exist or is unreadable.
 */
export async function readFileContent(filePath: string): Promise<string | null> {
  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return null;
    }
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Safely write content to a file. Creates parent directories if needed.
 * Optionally creates a backup of the original file before writing.
 */
export async function writeFileContent(
  filePath: string,
  content: string,
  createBackup = false,
): Promise<void> {
  try {
    await fs.ensureDir(path.dirname(filePath));

    if (createBackup) {
      const exists = await fs.pathExists(filePath);
      if (exists) {
        const backupPath = `${filePath}.backup`;
        await fs.copy(filePath, backupPath);
      }
    }

    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write file ${filePath}: ${message}`);
  }
}

/**
 * Check if a file exists at the given path.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    return await fs.pathExists(filePath);
  } catch {
    return false;
  }
}

/**
 * Get file stats safely. Returns null if file does not exist.
 */
export async function getFileStats(filePath: string): Promise<fs.Stats | null> {
  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return null;
    }
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

/**
 * Scan a directory recursively for files matching a pattern.
 *
 * @param dirPath - Directory to scan
 * @param pattern - Glob pattern (default: all .md files)
 * @returns Array of absolute file paths
 */
export async function scanDirectory(
  dirPath: string,
  pattern = '**/*.md',
): Promise<string[]> {
  try {
    const exists = await fs.pathExists(dirPath);
    if (!exists) {
      return [];
    }

    const files = await glob(pattern, {
      cwd: dirPath,
      absolute: true,
      nodir: true,
    });

    return files.map((f) => path.normalize(f));
  } catch {
    return [];
  }
}

/**
 * Get the relative path from a base directory.
 */
export function getRelativePath(basePath: string, fullPath: string): string {
  return path.relative(basePath, fullPath);
}
