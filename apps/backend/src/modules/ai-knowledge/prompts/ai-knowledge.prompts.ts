import { AiAnalysisKind } from '../interfaces/ai-knowledge.interfaces';

export const AI_PROMPT_VERSION = 1;

export function buildSystemPrompt(kind: AiAnalysisKind): string {
  return [
    'You are an enterprise engineering knowledge extraction model.',
    'Return ONLY valid JSON.',
    'Do not answer questions. Do not chat.',
    'Extract structured engineering knowledge for later embedding/indexing.',
    `Current analysis kind: ${kind}.`,
    'Prefer concise, factual summaries grounded only in the provided content.',
    'If something is unknown, use empty arrays or omit optional text by returning null-compatible empty strings.',
    'Relationships should reference items explicitly mentioned in the content or metadata.',
  ].join(' ');
}

export function buildUserPrompt(input: {
  kind: AiAnalysisKind;
  title: string;
  metadata: Record<string, unknown>;
  content: string;
}): string {
  return [
    `Prompt version: ${AI_PROMPT_VERSION}`,
    `Analysis kind: ${input.kind}`,
    `Title: ${input.title}`,
    `Metadata: ${JSON.stringify(input.metadata)}`,
    '',
    'Return a JSON object with this shape:',
    JSON.stringify(
      {
        kind: input.kind,
        summary: 'string',
        purpose: 'string',
        architectureStyle: 'string',
        domain: 'string',
        mainModules: ['string'],
        externalIntegrations: ['string'],
        featureSummary: 'string',
        businessImpact: 'string',
        technicalImpact: 'string',
        repositoryHealth: 'string',
        developmentActivitySummary: 'string',
        recentEngineeringChanges: ['string'],
        majorMilestones: ['string'],
        timeline: ['string'],
        category: 'string',
        severity: 'string',
        status: 'string',
        rootCause: 'string',
        suggestedResolution: 'string',
        bugFix: false,
        feature: false,
        refactor: false,
        breakingChange: false,
        riskLevel: 'low|medium|high',
        filesChanged: ['string'],
        components: ['string'],
        apis: ['string'],
        dependencies: ['string'],
        configuration: ['string'],
        concepts: ['string'],
        topics: ['string'],
        modules: ['string'],
        technologies: ['string'],
        keywords: ['string'],
        relationships: [
          {
            type: 'string',
            sourceType: 'string',
            internalRefId: 'string',
            externalRefId: 'string',
            title: 'string',
          },
        ],
        insights: ['string'],
      },
      null,
      2,
    ),
    '',
    'Content:',
    input.content,
  ].join('\n');
}
