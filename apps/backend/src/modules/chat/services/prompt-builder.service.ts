// ============================================================
// Prompt Builder Service
// Constructs the full system + user prompt from:
//   - Workspace/repo metadata
//   - Conversation history
//   - Retrieved knowledge chunks
//   - User question
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CHAT_PROMPT_VERSION } from '../constants/chat.constants';
import type {
  BuiltPrompt,
  HistoryMessage,
  PromptBuildInput,
} from '../interfaces/chat.interfaces';
import type { RankedSearchHit } from '../../search/interfaces/search.interfaces';
import { TokenBudgetService } from './token-budget.service';

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenBudget: TokenBudgetService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────

  async build(input: PromptBuildInput): Promise<BuiltPrompt> {
    const repoContext = await this.resolveRepositoryContext(
      input.workspaceId,
      input.repositoryIds,
    );

    const systemPrompt = this.buildSystemPrompt(repoContext);
    const systemTokens = this.tokenBudget.estimate(systemPrompt);

    const budget = this.tokenBudget.allocate({
      systemPromptTokens: systemTokens,
      chunks: input.chunks,
      historyMessages: input.history,
      provider: input.provider,
    });

    const userPrompt = this.buildUserPrompt({
      userQuery: input.userQuery,
      chunks: budget.chunks,
      history: budget.historyMessages,
    });

    const estimatedTokens =
      systemTokens +
      this.tokenBudget.estimate(userPrompt) +
      this.tokenBudget.estimate(JSON.stringify(budget.historyMessages));

    if (budget.chunksDropped > 0 || budget.historyDropped > 0) {
      this.logger.debug(
        `PromptBuilder trimmed: ${budget.chunksDropped} chunks, ${budget.historyDropped} history msgs dropped`,
      );
    }

    return {
      systemPrompt,
      userPrompt,
      promptVersion: CHAT_PROMPT_VERSION,
      estimatedTokens,
    };
  }

  // ──────────────────────────────────────────────────────────
  // System Prompt
  // ──────────────────────────────────────────────────────────

  private buildSystemPrompt(repoContext: string): string {
    return [
      'You are an expert AI engineering assistant embedded inside an AI Digital Twin Platform.',
      'You help software engineers understand codebases, trace changes, investigate bugs, and navigate architecture decisions.',
      '',
      'RESPONSE STRUCTURE & FORMATTING RULES:',
      '1. Direct Answer: Start with a clear, concise summary that directly answers the user query.',
      '2. Information Hierarchy: Structure your response using Markdown headings (## and ###), bullet lists, and numbered steps.',
      '3. Clean Code: When illustrating code or architecture, use fenced code blocks with language tags (e.g. ```typescript).',
      '4. File Paths: Mention file paths using inline code (e.g. `src/modules/auth/auth.service.ts`), NEVER dump raw unformatted paths into sentences.',
      '5. Grounded Citations: Cite referenced knowledge chunks at the end of sentences using [^N] notation where N is the chunk number.',
      '6. Grounding: Answer ONLY from the provided Knowledge Context. If information is not in the context, state it clearly.',
      '7. Repository Stats & Files: When asked about file counts, programming languages, or repository inventory, refer to the Repository Scope & File Inventory provided below to give direct, exact numbers.',
      '8. Readability & Spacing: Provide polished Markdown formatting like ChatGPT with clean headings, readable paragraphs, bullet points, and syntax-tagged code blocks.',
      '',
      'Return your answer as a JSON object with this exact shape:',
      JSON.stringify(
        {
          answer:
            'string — polished markdown answer with headings, lists, code blocks, and subtle [^N] citations',
          confidence: 0.95,
          relatedFiles: ['string — list of key file paths referenced'],
          relatedTopics: ['string — relevant engineering topics'],
        },
        null,
        2,
      ),
      '',
      repoContext,
    ].join('\n');
  }

  // ──────────────────────────────────────────────────────────
  // User Prompt
  // ──────────────────────────────────────────────────────────

  private buildUserPrompt(params: {
    userQuery: string;
    chunks: RankedSearchHit[];
    history: HistoryMessage[];
  }): string {
    const parts: string[] = [];

    // ── Conversation history ──
    if (params.history.length > 0) {
      parts.push('## Conversation History');
      for (const msg of params.history) {
        const label = msg.role === 'user' ? 'User' : 'Assistant';
        parts.push(`**${label}:** ${msg.content}`);
      }
      parts.push('');
    }

    // ── Knowledge context ──
    parts.push('## Knowledge Context');
    if (params.chunks.length === 0) {
      parts.push(
        '_No relevant knowledge chunks found. Answer from general engineering knowledge only._',
      );
    } else {
      params.chunks.forEach((chunk, i) => {
        const meta: string[] = [];
        if (chunk.repositoryName) meta.push(`repo: ${chunk.repositoryName}`);
        if (chunk.filePath) meta.push(`file: ${chunk.filePath}`);
        if (chunk.knowledgeType) meta.push(`type: ${chunk.knowledgeType}`);
        const metaStr = meta.length ? ` (${meta.join(', ')})` : '';

        parts.push(`### [^${i + 1}]${metaStr}`);
        parts.push('```');
        parts.push(chunk.preview.slice(0, 1200)); // Hard cap per chunk
        parts.push('```');
        parts.push('');
      });
    }

    // ── Question ──
    parts.push('## Question');
    parts.push(params.userQuery);
    parts.push('');
    parts.push(
      'Return ONLY the JSON object described in the system instructions. Do not include any other text.',
    );

    return parts.join('\n');
  }

  // ──────────────────────────────────────────────────────────
  // Repository Context Header
  // ──────────────────────────────────────────────────────────

  private async resolveRepositoryContext(
    workspaceId: string,
    repositoryIds?: string[],
  ): Promise<string> {
    try {
      const where = repositoryIds?.length
        ? { id: { in: repositoryIds }, workspaceId, deletedAt: null }
        : { workspaceId, deletedAt: null };

      const repos = await this.prisma.repository.findMany({
        where,
        select: {
          id: true,
          name: true,
          fullName: true,
          language: true,
          defaultBranch: true,
        },
        take: 10,
      });

      if (repos.length === 0) return '';

      const repoEntries = await Promise.all(
        repos.map(async (r) => {
          // Query sample file paths from knowledgeSource to provide accurate file counts & structure
          const sources = await this.prisma.knowledgeSource.findMany({
            where: { repositoryId: r.id, path: { not: null } },
            select: { path: true },
            take: 250,
          });

          const extCounts: Record<string, number> = {};
          for (const s of sources) {
            if (!s.path) continue;
            const extMatch = s.path.match(/\.([a-zA-Z0-9]+)$/);
            const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : 'other';
            extCounts[ext] = (extCounts[ext] || 0) + 1;
          }

          const fileSummary = Object.entries(extCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([ext, count]) => `${count} ${ext}`)
            .join(', ');

          const samplePaths = sources
            .map((s) => s.path)
            .filter((p): p is string => Boolean(p))
            .slice(0, 10);

          let entry = `- **${r.fullName ?? r.name}** (language: ${r.language ?? 'unknown'}, branch: ${r.defaultBranch ?? 'main'})`;
          if (sources.length > 0) {
            entry += `\n  - Indexed files (${sources.length} total): ${fileSummary}`;
            if (samplePaths.length > 0) {
              entry += `\n  - Sample paths: ${samplePaths.join(', ')}`;
            }
          }
          return entry;
        }),
      );

      return `## Repository Scope & File Inventory\n${repoEntries.join('\n\n')}\n`;
    } catch (error) {
      this.logger.warn(
        `Failed to resolve repository context: ${error instanceof Error ? error.message : String(error)}`,
      );
      return '';
    }
  }
}
