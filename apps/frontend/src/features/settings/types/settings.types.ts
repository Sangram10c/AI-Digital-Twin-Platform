/**
 * Settings Feature Types
 */

export interface WorkspaceSettingsDto {
  name?: string;
  slug?: string;
  description?: string;
  defaultBranch?: string;
  timezone?: string;
  defaultAiProvider?: string;
  defaultModel?: string;
}

export interface NotificationPreferences {
  repositorySync: boolean;
  knowledgeProcessing: boolean;
  aiCompletion: boolean;
  jobFailures: boolean;
  weeklyDigest: boolean;
}

export interface AiProviderConfig {
  id: string;
  name: string;
  provider: string;
  isConfigured: boolean;
  isDefault: boolean;
  models: string[];
}
