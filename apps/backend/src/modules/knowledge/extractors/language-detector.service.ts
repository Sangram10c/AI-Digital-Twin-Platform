import { Injectable } from '@nestjs/common';
import {
  DetectedLanguageKind,
  KnowledgeProcessingMetadata,
  NormalizedKnowledgeDocument,
} from '../interfaces/knowledge.interfaces';

@Injectable()
export class LanguageDetectorService {
  detect(
    content: string,
    filePath?: string,
  ): {
    language: string;
    kind: DetectedLanguageKind;
  } {
    const extension = this.extensionFromPath(filePath);
    if (extension) {
      const fromExtension = this.fromExtension(extension);
      if (fromExtension) return fromExtension;
    }

    const trimmed = content.trim();
    if (this.looksLikeJson(trimmed)) {
      return { language: 'json', kind: DetectedLanguageKind.JSON };
    }
    if (this.looksLikeYaml(trimmed)) {
      return { language: 'yaml', kind: DetectedLanguageKind.YAML };
    }
    if (this.looksLikeMarkdown(trimmed, filePath)) {
      return { language: 'markdown', kind: DetectedLanguageKind.MARKDOWN };
    }

    return { language: 'text', kind: DetectedLanguageKind.NATURAL };
  }

  applyToMetadata(
    document: NormalizedKnowledgeDocument,
    content: string,
  ): KnowledgeProcessingMetadata {
    const detection = this.detect(
      content,
      document.path ?? document.metadata.filePath,
    );
    return {
      ...document.metadata,
      detectedLanguage: detection.language,
      languageKind: detection.kind,
    };
  }

  private extensionFromPath(filePath?: string): string | null {
    if (!filePath) return null;
    const match = /\.([a-zA-Z0-9]+)$/.exec(filePath);
    return match ? match[1].toLowerCase() : null;
  }

  private fromExtension(extension: string): {
    language: string;
    kind: DetectedLanguageKind;
  } | null {
    const programming: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
    };

    const config: Record<string, string> = {
      env: 'env',
      ini: 'ini',
      toml: 'toml',
      properties: 'properties',
    };

    if (programming[extension]) {
      return {
        language: programming[extension],
        kind: DetectedLanguageKind.PROGRAMMING,
      };
    }

    if (extension === 'json') {
      return { language: 'json', kind: DetectedLanguageKind.JSON };
    }
    if (['yml', 'yaml'].includes(extension)) {
      return { language: 'yaml', kind: DetectedLanguageKind.YAML };
    }
    if (['md', 'markdown'].includes(extension)) {
      return { language: 'markdown', kind: DetectedLanguageKind.MARKDOWN };
    }
    if (config[extension]) {
      return { language: config[extension], kind: DetectedLanguageKind.CONFIG };
    }

    return null;
  }

  private looksLikeJson(content: string): boolean {
    return (
      (content.startsWith('{') && content.endsWith('}')) ||
      (content.startsWith('[') && content.endsWith(']'))
    );
  }

  private looksLikeYaml(content: string): boolean {
    return /^[\w-]+:\s/m.test(content) && !content.includes('{');
  }

  private looksLikeMarkdown(content: string, filePath?: string): boolean {
    if (filePath && /\.(md|markdown)$/i.test(filePath)) return true;
    return /^#{1,6}\s/m.test(content) || /^\s*[-*+]\s/m.test(content);
  }
}
