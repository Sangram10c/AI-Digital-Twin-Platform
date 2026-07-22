import { Injectable } from '@nestjs/common';
import { AI_KNOWLEDGE_LIMITS } from '../constants/ai-knowledge.constants';
import {
  AiAnalysisKind,
  AiExtractionMetadata,
  AiProviderRequest,
  ExtractedEngineeringKnowledge,
  SupportedAiProvider,
} from '../interfaces/ai-knowledge.interfaces';
import {
  buildSystemPrompt,
  buildUserPrompt,
  AI_PROMPT_VERSION,
} from '../prompts/ai-knowledge.prompts';
import { AiProvidersService } from '../providers/ai-providers.service';
import { AiHeuristicsExtractorService } from '../extractors/ai-heuristics-extractor.service';
import { AiKnowledgeStorageService } from './ai-knowledge-storage.service';
import { truncateForPrompt } from '../utils/json.util';

@Injectable()
export class AiKnowledgeExtractionService {
  constructor(
    private readonly storage: AiKnowledgeStorageService,
    private readonly providers: AiProvidersService,
    private readonly heuristics: AiHeuristicsExtractorService,
  ) {}

  async analyze(
    kind: AiAnalysisKind,
    documentId: string,
    options: { provider?: SupportedAiProvider; force?: boolean } = {},
  ): Promise<AiExtractionMetadata> {
    const document = await this.storage.loadAnalysisDocument(kind, documentId);
    const existing = this.storage.readExtractionMetadata(document);

    if (
      !options.force &&
      existing?.status === 'COMPLETED' &&
      existing.contentChecksum === document.contentChecksum &&
      existing.promptVersion === AI_PROMPT_VERSION
    ) {
      const skipped: AiExtractionMetadata = {
        ...existing,
        status: 'SKIPPED',
        skippedAt: new Date().toISOString(),
      };
      await this.storage.saveExtraction(document, skipped);
      return skipped;
    }

    const processing: AiExtractionMetadata = {
      status: 'PROCESSING',
      contentChecksum: document.contentChecksum,
      promptVersion: AI_PROMPT_VERSION,
      provider: options.provider,
    };
    await this.storage.saveExtraction(document, processing);

    const request: AiProviderRequest = {
      provider: options.provider,
      systemPrompt: buildSystemPrompt(kind),
      userPrompt: buildUserPrompt({
        kind,
        title: document.title,
        metadata: document.metadata,
        content: truncateForPrompt(
          document.content,
          AI_KNOWLEDGE_LIMITS.maxInputCharacters,
        ),
      }),
      temperature: 0.1,
    };

    try {
      const providerResult =
        await this.providers.generateStructuredJson(request);
      const heuristics = await this.heuristics.enrich(
        document,
        providerResult.output,
      );
      const result = this.mergeResult(kind, providerResult.output, heuristics);

      const completed: AiExtractionMetadata = {
        status: 'COMPLETED',
        contentChecksum: document.contentChecksum,
        promptVersion: AI_PROMPT_VERSION,
        provider: providerResult.provider,
        model: providerResult.model,
        extractedAt: new Date().toISOString(),
        latencyMs: providerResult.latencyMs,
        rawText: providerResult.rawText,
        result,
        lastError: null,
      };
      await this.storage.saveExtraction(document, completed);
      return completed;
    } catch (error) {
      const failed: AiExtractionMetadata = {
        ...processing,
        status: 'FAILED',
        lastError:
          error instanceof Error ? error.message : 'AI extraction failed',
      };
      await this.storage.saveExtraction(document, failed);
      throw error;
    }
  }

  private mergeResult(
    kind: AiAnalysisKind,
    providerOutput: Record<string, unknown>,
    heuristics: Partial<ExtractedEngineeringKnowledge>,
  ): ExtractedEngineeringKnowledge {
    const pickArray = (value: unknown): string[] =>
      Array.isArray(value)
        ? value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)
        : [];
    const pickString = (value: unknown): string | undefined =>
      typeof value === 'string' && value.trim() ? value.trim() : undefined;
    const pickBool = (value: unknown): boolean =>
      typeof value === 'boolean' ? value : false;

    return {
      kind,
      summary: pickString(providerOutput.summary) ?? 'No summary generated',
      purpose: pickString(providerOutput.purpose),
      architectureStyle: pickString(providerOutput.architectureStyle),
      domain: pickString(providerOutput.domain),
      mainModules:
        heuristics.mainModules ?? pickArray(providerOutput.mainModules),
      externalIntegrations:
        heuristics.externalIntegrations ??
        pickArray(providerOutput.externalIntegrations),
      featureSummary: pickString(providerOutput.featureSummary),
      businessImpact: pickString(providerOutput.businessImpact),
      technicalImpact: pickString(providerOutput.technicalImpact),
      repositoryHealth: pickString(providerOutput.repositoryHealth),
      developmentActivitySummary: pickString(
        providerOutput.developmentActivitySummary,
      ),
      recentEngineeringChanges: pickArray(
        providerOutput.recentEngineeringChanges,
      ),
      majorMilestones: pickArray(providerOutput.majorMilestones),
      timeline: pickArray(providerOutput.timeline),
      category: pickString(providerOutput.category),
      severity: pickString(providerOutput.severity),
      status: pickString(providerOutput.status),
      rootCause: pickString(providerOutput.rootCause),
      suggestedResolution: pickString(providerOutput.suggestedResolution),
      bugFix: pickBool(providerOutput.bugFix),
      feature: pickBool(providerOutput.feature),
      refactor: pickBool(providerOutput.refactor),
      breakingChange: pickBool(providerOutput.breakingChange),
      riskLevel: pickString(providerOutput.riskLevel),
      filesChanged:
        heuristics.filesChanged ?? pickArray(providerOutput.filesChanged),
      components: heuristics.components ?? pickArray(providerOutput.components),
      apis: heuristics.apis ?? pickArray(providerOutput.apis),
      dependencies:
        heuristics.dependencies ?? pickArray(providerOutput.dependencies),
      configuration:
        heuristics.configuration ?? pickArray(providerOutput.configuration),
      concepts: heuristics.concepts ?? pickArray(providerOutput.concepts),
      topics: heuristics.topics ?? pickArray(providerOutput.topics),
      modules: heuristics.modules ?? pickArray(providerOutput.modules),
      technologies:
        heuristics.technologies ?? pickArray(providerOutput.technologies),
      keywords: heuristics.keywords ?? pickArray(providerOutput.keywords),
      relationships: heuristics.relationships ?? [],
      insights: heuristics.insights ?? pickArray(providerOutput.insights),
    };
  }
}
