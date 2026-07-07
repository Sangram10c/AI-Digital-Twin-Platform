// ============================================
// Project Progress Manager — Document Scanner Service
// ============================================

import path from 'node:path';
import matter from 'gray-matter';
import {
  DOCS_DIR_PATH,
  MARKDOWN_PATTERNS,
  MIN_CONTENT_SIZE_BYTES,
  DOCUMENT_REGISTRY,
} from '../constants/index.js';
import type { DocumentInfo, ScannedDocument, DocumentStatus } from '../types/index.js';
import { scanDirectory, readFileContent, getFileStats } from '../utils/file-utils.js';

/**
 * Helper to generate a clean alphanumeric slug for comparing filenames and registry names.
 */
function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Helper to match a filename against the DOCUMENT_REGISTRY.
 * Returns the document number if matched, or null.
 */
export function matchDocumentNumber(filename: string): number | null {
  const base = path.basename(filename, '.md');

  // Strip leading numbers and connectors (e.g. "03-", "03_", "03 ")
  const nameWithoutNumber = base.replace(/^\d+[-_\s]*/, '');
  const fileSlug = getSlug(nameWithoutNumber);

  // Exact manual alias map for the codebase's specific document filenames
  const aliases: Record<string, number> = {
    projectoverview: 1,
    userjourney: 2,
    userjourneys: 2,
    functionalrequirement: 3,
    functionalrequirements: 3,
    nonfunctionalrequirement: 4,
    nonfunctionalrequirements: 4,
    systemarchitecture: 5,
    techstack: 6,
    technologystack: 6,
    databaseerd: 7,
    erd: 7,
    databasedesign: 8,
    apidesign: 9,
    authentication: 10,
    authenticationdesign: 10,
    githubintegration: 11,
    airagarchitecture: 12,
    ragpipeline: 12,
    searchenginedesign: 13,
    backgroundjobarchitecture: 14,
    security: 15,
    securityarchitecture: 15,
    frontendarchitecture: 16,
    backendarchitecture: 17,
    folderstructure: 18,
    codingstandards: 19,
    testingstrategy: 20,
    deployment: 21,
    deploymentarchitecture: 21,
    developmentroadmap: 22,
    featureroadmap: 22,
    futureenhancement: 23,
    futureenhancements: 23,
    glossary: 24,
  };

  if (aliases[fileSlug]) {
    return aliases[fileSlug];
  }

  // Singular fallback
  const singularSlug = fileSlug.replace(/s$/, '');
  if (aliases[singularSlug]) {
    return aliases[singularSlug];
  }

  // Fuzzy substring matching in registry
  for (const doc of DOCUMENT_REGISTRY) {
    const regSlug = getSlug(doc.name);
    const regSingular = regSlug.replace(/s$/, '');

    if (
      fileSlug === regSlug ||
      singularSlug === regSingular ||
      fileSlug.includes(regSingular) ||
      regSlug.includes(singularSlug)
    ) {
      return doc.number;
    }
  }

  return null;
}

/**
 * Service responsible for scanning the docs/ directory tree
 * and discovering numbered or named document files.
 */
export class DocScannerService {
  /**
   * Scan the entire docs/ directory and return discovered documents.
   */
  async scanDocuments(): Promise<ScannedDocument[]> {
    const allFiles = await scanDirectory(DOCS_DIR_PATH, '**/*.md');
    const scannedDocs: ScannedDocument[] = [];

    for (const filePath of allFiles) {
      const filename = path.basename(filePath);
      const docNumber = matchDocumentNumber(filename);

      if (docNumber === null) continue;

      const relativePath = path.relative(DOCS_DIR_PATH, filePath);
      const subdirectory = path.dirname(relativePath);

      const stats = await getFileStats(filePath);
      const sizeBytes = stats?.size ?? 0;

      let frontmatter: Record<string, unknown> = {};
      try {
        const content = await readFileContent(filePath);
        if (content) {
          const parsed = matter(content);
          frontmatter = parsed.data as Record<string, unknown>;
        }
      } catch {
        // Frontmatter parsing failed — not critical
      }

      scannedDocs.push({
        number: docNumber,
        filename,
        filePath,
        subdirectory: subdirectory === '.' ? '' : subdirectory,
        sizeBytes,
        frontmatter,
        hasContent: sizeBytes > MIN_CONTENT_SIZE_BYTES,
      });
    }

    // Sort by document number
    return scannedDocs.sort((a, b) => a.number - b.number);
  }

  /**
   * Match scanned documents against the CURRENT_STATUS.md document table.
   * Enriches DocumentInfo with file paths and existence data.
   */
  async matchDocumentsToStatus(documents: DocumentInfo[]): Promise<DocumentInfo[]> {
    const scanned = await this.scanDocuments();
    const scannedByNumber = new Map<number, ScannedDocument>();

    for (const doc of scanned) {
      scannedByNumber.set(doc.number, doc);
    }

    return documents.map((doc) => {
      const scannedDoc = scannedByNumber.get(doc.number);

      // Auto-detect status based on scanned file metadata/frontmatter
      let detectedStatus = doc.status;
      if (scannedDoc) {
        const fmStatus = scannedDoc.frontmatter['status'] as string | undefined;
        if (fmStatus) {
          const cleanFmStatus = fmStatus.toLowerCase().trim();
          if (
            cleanFmStatus === 'completed' ||
            cleanFmStatus === 'complete' ||
            cleanFmStatus === 'done'
          ) {
            detectedStatus = 'completed';
          } else if (
            cleanFmStatus === 'in-progress' ||
            cleanFmStatus === 'draft' ||
            cleanFmStatus === 'started'
          ) {
            detectedStatus = 'in-progress';
          } else if (cleanFmStatus === 'not-started') {
            detectedStatus = 'not-started';
          }
        }
      }

      return {
        ...doc,
        status: detectedStatus,
        filePath: scannedDoc?.filePath ?? null,
        existsOnDisk: scannedDoc !== undefined,
      };
    });
  }

  /**
   * Get a comprehensive document map including auto-status detection.
   */
  async getFullDocumentMap(documents: DocumentInfo[]): Promise<DocumentInfo[]> {
    return this.matchDocumentsToStatus(documents);
  }

  /**
   * Get the expected document number-to-name mapping from the registry.
   */
  getRegistryDocuments(): readonly { number: number; name: string }[] {
    return DOCUMENT_REGISTRY;
  }
}
