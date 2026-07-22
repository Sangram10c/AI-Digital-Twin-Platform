import { DocumentationType, KnowledgeSourceType } from '@prisma/client';

export type SupportedAiProvider =
  | 'groq'
  | 'openrouter'
  | 'huggingface'
  | 'cloudflare'
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'ollama';

export type AiAnalysisKind =
  'repository' | 'commit' | 'pull_request' | 'issue' | 'document';

export type AiExtractionStatus =
  'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface AiProviderResult<T = Record<string, unknown>> {
  provider: SupportedAiProvider;
  model: string;
  output: T;
  rawText: string;
  latencyMs: number;
}

export interface AiProviderRequest {
  provider?: SupportedAiProvider;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export interface KnowledgeRelationshipRef {
  type: string;
  sourceType?: KnowledgeSourceType | 'DOCUMENTATION';
  internalRefId?: string;
  externalRefId?: string;
  title?: string;
}

export interface ExtractedEngineeringKnowledge {
  kind: AiAnalysisKind;
  summary: string;
  purpose?: string;
  architectureStyle?: string;
  domain?: string;
  mainModules: string[];
  externalIntegrations: string[];
  featureSummary?: string;
  businessImpact?: string;
  technicalImpact?: string;
  repositoryHealth?: string;
  developmentActivitySummary?: string;
  recentEngineeringChanges?: string[];
  majorMilestones?: string[];
  timeline?: string[];
  category?: string;
  severity?: string;
  status?: string;
  rootCause?: string;
  suggestedResolution?: string;
  bugFix?: boolean;
  feature?: boolean;
  refactor?: boolean;
  breakingChange?: boolean;
  riskLevel?: string;
  filesChanged: string[];
  components: string[];
  apis: string[];
  dependencies: string[];
  configuration: string[];
  concepts: string[];
  topics: string[];
  modules: string[];
  technologies: string[];
  keywords: string[];
  relationships: KnowledgeRelationshipRef[];
  insights: string[];
}

export interface AiExtractionMetadata {
  status: AiExtractionStatus;
  contentChecksum: string;
  promptVersion: number;
  provider?: SupportedAiProvider;
  model?: string;
  extractedAt?: string;
  skippedAt?: string;
  lastError?: string | null;
  latencyMs?: number;
  result?: ExtractedEngineeringKnowledge;
  rawText?: string;
}

export interface AiAnalysisDocument {
  id: string;
  workspaceId: string;
  repositoryId?: string | null;
  title: string;
  content: string;
  contentChecksum: string;
  sourceType?: KnowledgeSourceType;
  documentationType?: DocumentationType;
  externalRefId: string;
  internalRefId?: string | null;
  path?: string | null;
  metadata: Record<string, unknown>;
  kind: AiAnalysisKind;
}

export type AiExtractionScope = 'light' | 'recent' | 'full';

export interface AiKnowledgeJobPayload {
  workspaceId: string;
  repositoryId?: string;
  documentId?: string;
  sourceType?: KnowledgeSourceType;
  documentationId?: string;
  provider?: SupportedAiProvider;
  force?: boolean;
  /** light = repo+docs only (default); recent = light + last N; full = everything */
  scope?: AiExtractionScope;
  trigger?: string;
}

export interface AiRetryJobPayload extends AiKnowledgeJobPayload {
  jobName: string;
  originalQueue: string;
  retryCount: number;
  error: string;
}
