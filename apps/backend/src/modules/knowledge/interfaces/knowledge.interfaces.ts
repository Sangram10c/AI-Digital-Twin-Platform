import { DocumentationType, KnowledgeSourceType } from '@prisma/client';
import { KNOWLEDGE_QUEUES } from '../constants/knowledge.constants';

export type KnowledgeQueueName =
  (typeof KNOWLEDGE_QUEUES)[keyof typeof KNOWLEDGE_QUEUES];

export enum KnowledgeProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export enum KnowledgeDocumentKind {
  SOURCE = 'source',
  DOCUMENTATION = 'documentation',
}

export enum DetectedLanguageKind {
  PROGRAMMING = 'programming',
  NATURAL = 'natural',
  MARKDOWN = 'markdown',
  JSON = 'json',
  YAML = 'yaml',
  CONFIG = 'config',
  UNKNOWN = 'unknown',
}

export interface KnowledgeProcessingMetadata {
  processingStatus?: KnowledgeProcessingStatus;
  contentChecksum?: string;
  lastProcessedAt?: string;
  rawContent?: string;
  documentType?: string;
  detectedLanguage?: string;
  languageKind?: DetectedLanguageKind;
  author?: string;
  labels?: string[];
  branch?: string;
  commitSha?: string;
  prNumber?: number;
  issueNumber?: number;
  filePath?: string;
  sourceCreatedAt?: string;
  sourceUpdatedAt?: string;
  chunkCount?: number;
  processingError?: string;
  version?: number;
  repositoryLanguage?: string;
  [key: string]: unknown;
}

export interface NormalizedKnowledgeDocument {
  documentKind: KnowledgeDocumentKind;
  workspaceId: string;
  repositoryId: string;
  sourceType?: KnowledgeSourceType;
  documentationType?: DocumentationType;
  externalRefId: string;
  internalRefId?: string;
  title: string;
  rawContent: string;
  path?: string;
  url?: string;
  metadata: KnowledgeProcessingMetadata;
}

export interface KnowledgeChunkDraft {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  contentHash: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeJobPayload {
  workspaceId: string;
  repositoryId: string;
  triggeredBy?: string;
  force?: boolean;
}

export interface KnowledgeEntityJobPayload extends KnowledgeJobPayload {
  entityId: string;
}

export interface KnowledgeChunkJobPayload extends KnowledgeJobPayload {
  documentKind: KnowledgeDocumentKind;
  documentId: string;
  force?: boolean;
}

export interface KnowledgeDeadLetterPayload extends KnowledgeJobPayload {
  error: string;
  attemptsMade: number;
  sourceQueue: string;
  jobName: string;
  entityId?: string;
}
