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
      'You help software engineers understand codebases, trace changes, investigate bugs,',
      'and navigate architecture decisions.',
      '',
      'RULES:',
      '- Answer ONLY from the provided Knowledge Context below.',
      '- If the context does not contain enough information, say so honestly — do not hallucinate.',
      '- Be precise, concise, and cite sources using [^N] notation where N is the chunk index.',
      '- Return your answer as a JSON object with this exact shape:',
      JSON.stringify(
        {
          answer: 'string — markdown-formatted answer with [^N] citations',
          confidence: 0.9,
          relatedFiles: ['string — file paths mentioned in your answer'],
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
          name: true,
          fullName: true,
          language: true,
          defaultBranch: true,
        },
        take: 10,
      });

      if (repos.length === 0) return '';

      const repoList = repos
        .map(
          (r) =>
            `- ${r.fullName ?? r.name} (language: ${r.language ?? 'unknown'}, branch: ${r.defaultBranch ?? 'main'})`,
        )
        .join('\n');

      return `## Repository Scope\n${repoList}\n`;
    } catch (error) {
      this.logger.warn(
        `Failed to resolve repository context: ${error instanceof Error ? error.message : String(error)}`,
      );
      return '';
    }
  }
}
