import { Injectable } from '@nestjs/common';
import {
  SEARCH_QUERY_EXPANSIONS,
  SEARCH_STOP_WORDS,
} from '../constants/search.constants';
import type { ProcessedQuery } from '../interfaces/search.interfaces';

@Injectable()
export class QueryProcessor {
  process(rawQuery: string): ProcessedQuery {
    const raw = (rawQuery ?? '').trim();
    const { withoutAliases, repositoryAliases } = this.extractRepoAliases(raw);
    const normalized = this.normalizeWhitespace(withoutAliases.toLowerCase());
    const language = this.detectLanguage(normalized);
    const phrases = this.extractPhrases(normalized);
    const exactTerms = this.extractExactTerms(normalized);
    const stripped = this.stripQuotedSegments(normalized);
    const tokens = this.tokenize(stripped);
    const keywords = tokens.filter(
      (t) => !SEARCH_STOP_WORDS.has(t) && t.length > 1,
    );
    const expandedTerms = this.expand(keywords);
    const tsQuery = this.buildTsQuery(expandedTerms, phrases, exactTerms);
    const embeddingText = [
      normalized,
      ...expandedTerms.filter((t) => !normalized.includes(t)),
    ]
      .join(' ')
      .trim();

    return {
      raw,
      normalized,
      language,
      keywords,
      expandedTerms,
      phrases,
      exactTerms,
      repositoryAliases,
      tsQuery,
      embeddingText: embeddingText || normalized || raw,
    };
  }

  private normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private detectLanguage(text: string): string {
    if (!text) return 'unknown';
    let nonAscii = 0;
    for (let i = 0; i < text.length; i += 1) {
      if (text.charCodeAt(i) > 127) nonAscii += 1;
    }
    const ratio = nonAscii / Math.max(text.length, 1);
    if (ratio > 0.3) return 'non-english';
    return 'en';
  }

  private extractRepoAliases(raw: string): {
    withoutAliases: string;
    repositoryAliases: string[];
  } {
    const aliases: string[] = [];
    const withoutAliases = raw.replace(
      /\brepo(?:sitory)?:([a-zA-Z0-9._/-]+)/gi,
      (_m, name: string) => {
        aliases.push(name.toLowerCase());
        return ' ';
      },
    );
    return { withoutAliases, repositoryAliases: [...new Set(aliases)] };
  }

  private extractPhrases(text: string): string[] {
    const matches = text.match(/"([^"]{2,})"/g) ?? [];
    return matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
  }

  private extractExactTerms(text: string): string[] {
    const matches = text.match(/'([^']{2,})'/g) ?? [];
    return matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
  }

  private stripQuotedSegments(text: string): string {
    return text.replace(/"[^"]*"/g, ' ').replace(/'[^']*'/g, ' ');
  }

  private tokenize(text: string): string[] {
    return text
      .replace(/[^\p{L}\p{N}_./+-]+/gu, ' ')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  private expand(keywords: string[]): string[] {
    const out = new Set(keywords);
    for (const kw of keywords) {
      const extras = SEARCH_QUERY_EXPANSIONS[kw];
      if (extras) extras.forEach((e) => out.add(e));
    }
    return [...out];
  }

  /**
   * Builds a safe tsquery string. Uses plainto_tsquery-compatible OR of lexemes
   * plus phrase operators. Callers pass this to `to_tsquery` / `websearch_to_tsquery`
   * via parameterized SQL — never concatenate user input into SQL.
   */
  buildTsQuery(
    keywords: string[],
    phrases: string[],
    exactTerms: string[],
  ): string {
    const parts: string[] = [];

    for (const phrase of phrases) {
      const toks = this.tokenize(phrase).filter(
        (t) => !SEARCH_STOP_WORDS.has(t),
      );
      if (toks.length >= 2) {
        parts.push(toks.map((t) => this.lex(t)).join(' <-> '));
      } else if (toks.length === 1) {
        parts.push(this.lex(toks[0]));
      }
    }

    for (const exact of exactTerms) {
      const toks = this.tokenize(exact);
      if (toks.length) {
        parts.push(toks.map((t) => this.lex(t)).join(' & '));
      }
    }

    for (const kw of keywords) {
      // Prefix matching: nest:*
      parts.push(`${this.lex(kw)}:*`);
      // Hyphenated expansions (embedding-storage) → also search parts
      for (const part of kw.split(/[-_/./]+/)) {
        if (part.length > 1) {
          parts.push(`${this.lex(part)}:*`);
        }
      }
    }

    const unique = [...new Set(parts.filter(Boolean))];
    return unique.length ? unique.join(' | ') : this.lex('search') + ':*';
  }

  /** Strip tsquery metacharacters from a token. */
  private lex(token: string): string {
    return token.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'x';
  }
}
