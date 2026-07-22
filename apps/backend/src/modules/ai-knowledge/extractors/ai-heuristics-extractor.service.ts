import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  AI_TOPIC_KEYWORDS,
  KNOWN_PROJECT_MODULES,
} from '../constants/ai-knowledge.constants';
import {
  AiAnalysisDocument,
  ExtractedEngineeringKnowledge,
  KnowledgeRelationshipRef,
} from '../interfaces/ai-knowledge.interfaces';
import { unknownToString } from '../utils/json.util';

@Injectable()
export class AiHeuristicsExtractorService {
  constructor(private readonly prisma: PrismaService) {}

  async enrich(
    document: AiAnalysisDocument,
    aiOutput: Record<string, unknown>,
  ): Promise<Partial<ExtractedEngineeringKnowledge>> {
    const text = `${document.title}\n${document.content}`.toLowerCase();
    const repository = document.repositoryId
      ? await this.prisma.repository.findUnique({
          where: { id: document.repositoryId },
          select: { providerMetadata: true, language: true },
        })
      : null;

    const stack = this.readStack(repository?.providerMetadata);
    const topics = this.detectTopics(text, stack);
    const modules = this.detectModules(document, text);
    const technologies = this.detectTechnologies(stack, topics, text);
    const relationships = await this.detectRelationships(document);

    return {
      topics,
      modules,
      technologies,
      keywords: this.mergeStrings(
        topics,
        technologies,
        this.pickStringArray(aiOutput.keywords),
      ),
      mainModules: this.mergeStrings(
        modules,
        this.pickStringArray(aiOutput.mainModules),
      ),
      externalIntegrations: this.pickStringArray(aiOutput.externalIntegrations),
      filesChanged: this.pickStringArray(aiOutput.filesChanged),
      components: this.pickStringArray(aiOutput.components),
      apis: this.pickStringArray(aiOutput.apis),
      dependencies: this.mergeStrings(
        technologies,
        this.pickStringArray(aiOutput.dependencies),
      ),
      configuration: this.pickStringArray(aiOutput.configuration),
      concepts: this.pickStringArray(aiOutput.concepts),
      insights: this.pickStringArray(aiOutput.insights),
      relationships,
    };
  }

  private detectTopics(text: string, stackNames: string[]): string[] {
    const topics = new Set<string>();
    for (const [topic, keywords] of Object.entries(AI_TOPIC_KEYWORDS)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        topics.add(topic);
      }
    }
    for (const stackName of stackNames) {
      if (AI_TOPIC_KEYWORDS[stackName]) {
        topics.add(stackName);
      }
    }
    return [...topics];
  }

  private detectModules(document: AiAnalysisDocument, text: string): string[] {
    const modules = new Set<string>();
    const path = document.path?.toLowerCase() ?? '';
    for (const moduleName of KNOWN_PROJECT_MODULES) {
      if (path.includes(moduleName) || text.includes(`${moduleName} module`)) {
        modules.add(moduleName);
      }
    }
    const match = /modules\/([a-z0-9-]+)/i.exec(document.path ?? '');
    if (match?.[1]) {
      modules.add(match[1]);
    }
    return [...modules];
  }

  private detectTechnologies(
    stackNames: string[],
    topics: string[],
    text: string,
  ): string[] {
    const technologies = new Set<string>(stackNames);
    const keywordMap: Record<string, string> = {
      nestjs: 'NestJS',
      nextjs: 'Next.js',
      react: 'React',
      prisma: 'Prisma',
      postgresql: 'PostgreSQL',
      redis: 'Redis',
      bullmq: 'BullMQ',
      docker: 'Docker',
      openai: 'OpenAI',
      gemini: 'Gemini',
      anthropic: 'Anthropic',
    };
    for (const topic of topics) {
      if (keywordMap[topic]) {
        technologies.add(keywordMap[topic]);
      }
    }
    if (text.includes('postgres')) technologies.add('PostgreSQL');
    if (text.includes('github actions')) technologies.add('GitHub Actions');
    return [...technologies];
  }

  private async detectRelationships(
    document: AiAnalysisDocument,
  ): Promise<KnowledgeRelationshipRef[]> {
    const relationships: KnowledgeRelationshipRef[] = [];
    const numberRefs = [...document.content.matchAll(/#(\d+)/g)].map((match) =>
      Number(match[1]),
    );

    if (document.repositoryId) {
      for (const number of numberRefs.slice(0, 10)) {
        const [issue, pullRequest] = await Promise.all([
          this.prisma.issue.findUnique({
            where: {
              repositoryId_number: {
                repositoryId: document.repositoryId,
                number,
              },
            },
            select: { id: true, title: true },
          }),
          this.prisma.pullRequest.findUnique({
            where: {
              repositoryId_number: {
                repositoryId: document.repositoryId,
                number,
              },
            },
            select: { id: true, title: true },
          }),
        ]);
        if (issue) {
          relationships.push({
            type: 'related_issue',
            sourceType: 'ISSUE',
            internalRefId: issue.id,
            externalRefId: String(number),
            title: issue.title,
          });
        }
        if (pullRequest) {
          relationships.push({
            type: 'related_pull_request',
            sourceType: 'PULL_REQUEST',
            internalRefId: pullRequest.id,
            externalRefId: String(number),
            title: pullRequest.title,
          });
        }
      }
    }

    const commitSha = unknownToString(document.metadata.commitSha);
    if (commitSha) {
      relationships.push({
        type: 'self_commit',
        sourceType: 'COMMIT',
        internalRefId: document.internalRefId ?? undefined,
        externalRefId: commitSha,
      });
    }
    const prNumber = unknownToString(document.metadata.prNumber);
    if (prNumber) {
      relationships.push({
        type: 'self_pull_request',
        sourceType: 'PULL_REQUEST',
        internalRefId: document.internalRefId ?? undefined,
        externalRefId: prNumber,
      });
    }
    const issueNumber = unknownToString(document.metadata.issueNumber);
    if (issueNumber) {
      relationships.push({
        type: 'self_issue',
        sourceType: 'ISSUE',
        internalRefId: document.internalRefId ?? undefined,
        externalRefId: issueNumber,
      });
    }

    return relationships;
  }

  private readStack(metadata: unknown): string[] {
    if (!metadata || typeof metadata !== 'object') {
      return [];
    }
    const stack = (metadata as Record<string, unknown>).stack;
    if (!stack || typeof stack !== 'object') {
      return [];
    }
    const frameworks = Array.isArray(
      (stack as Record<string, unknown>).frameworks,
    )
      ? (
          (stack as Record<string, unknown>).frameworks as Array<
            Record<string, unknown>
          >
        ).map((item) => unknownToString(item.name))
      : [];
    const libraries = Array.isArray(
      (stack as Record<string, unknown>).libraries,
    )
      ? (
          (stack as Record<string, unknown>).libraries as Array<
            Record<string, unknown>
          >
        ).map((item) => unknownToString(item.name))
      : [];
    return [...new Set([...frameworks, ...libraries].filter(Boolean))];
  }

  private pickStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  private mergeStrings(...values: string[][]): string[] {
    return [...new Set(values.flat().filter(Boolean))];
  }
}
