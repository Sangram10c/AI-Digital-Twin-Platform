import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { KNOWN_NPM_PACKAGES } from '../../knowledge/constants/known-packages.constants';
import {
  AI_TOPIC_KEYWORDS,
  KNOWN_PROJECT_MODULES,
} from '../../ai-knowledge/constants/ai-knowledge.constants';
import { unknownToString } from '../../ai-knowledge/utils/json.util';

export interface HeuristicExtractionResult {
  languages: string[];
  frameworks: string[];
  libraries: string[];
  dependencies: string[];
  databases: string[];
  cloudProviders: string[];
  cicd: string[];
  modules: string[];
  topics: string[];
  technologies: string[];
  featureCount: number;
  bugFixCount: number;
  refactorCount: number;
  securityCount: number;
  performanceCount: number;
  riskScore: number;
  confidenceScore: number;
  folderStructure: Record<string, unknown>;
  relationships: Array<Record<string, string>>;
  rawSignals: Record<string, unknown>;
  contentChecksum: string;
}

@Injectable()
export class KnowledgeHeuristicsService {
  constructor(private readonly prisma: PrismaService) {}

  async extractForRepository(
    repositoryId: string,
  ): Promise<HeuristicExtractionResult> {
    const repository = await this.prisma.repository.findUniqueOrThrow({
      where: { id: repositoryId },
      include: {
        documentation: { take: 50, orderBy: { updatedAt: 'desc' } },
      },
    });

    const [commits, pullRequests, issues, releases, sources] =
      await Promise.all([
        this.prisma.commit.findMany({
          where: { repositoryId },
          select: { message: true, sha: true },
          take: 200,
          orderBy: { committedAt: 'desc' },
        }),
        this.prisma.pullRequest.findMany({
          where: { repositoryId },
          select: { number: true, title: true, body: true },
          take: 100,
          orderBy: { openedAt: 'desc' },
        }),
        this.prisma.issue.findMany({
          where: { repositoryId },
          select: { number: true, title: true, body: true },
          take: 100,
          orderBy: { openedAt: 'desc' },
        }),
        this.prisma.release.findMany({
          where: { repositoryId },
          select: { tagName: true, name: true, body: true },
          take: 50,
          orderBy: { publishedAt: 'desc' },
        }),
        this.prisma.knowledgeSource.findMany({
          where: { repositoryId },
          select: { path: true, title: true, metadata: true, sourceType: true },
          take: 300,
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

    const corpus = [
      repository.fullName,
      repository.description ?? '',
      repository.language ?? '',
      ...repository.documentation.map((d) => `${d.title}\n${d.content ?? ''}`),
      ...commits.map((c) => c.message),
      ...pullRequests.map((p) => `${p.title}\n${p.body ?? ''}`),
      ...issues.map((i) => `${i.title}\n${i.body ?? ''}`),
      ...releases.map((r) => `${r.name ?? r.tagName}\n${r.body ?? ''}`),
      ...sources.map((s) => `${s.path ?? ''}\n${s.title ?? ''}`),
    ]
      .join('\n')
      .toLowerCase();

    const stack = this.readStack(repository.providerMetadata);
    const frameworks = this.unique([
      ...stack.frameworks,
      ...this.matchKnownPackages(corpus, 'framework'),
    ]);
    const libraries = this.unique([
      ...stack.libraries,
      ...this.matchKnownPackages(corpus, 'library'),
    ]);
    const topics = this.detectTopics(corpus);
    const modules = this.detectModules(
      sources.map((s) => s.path ?? ''),
      corpus,
    );
    const relationships = this.detectRelationships(
      corpus,
      pullRequests,
      issues,
      commits,
    );
    const changeSignals = this.classifyChanges(commits.map((c) => c.message));

    const languages = this.unique(
      [repository.language, ...this.detectLanguages(corpus)].filter(
        Boolean,
      ) as string[],
    );
    const databases = this.detectList(corpus, {
      postgresql: ['postgres', 'postgresql', 'prisma'],
      mysql: ['mysql'],
      mongodb: ['mongodb', 'mongoose'],
      redis: ['redis', 'ioredis'],
    });
    const cloudProviders = this.detectList(corpus, {
      aws: ['aws', 's3', 'lambda'],
      gcp: ['gcp', 'google cloud'],
      azure: ['azure'],
      cloudflare: ['cloudflare'],
    });
    const cicd = this.detectList(corpus, {
      'github-actions': ['github actions', '.github/workflows'],
      jenkins: ['jenkins'],
      circleci: ['circleci'],
    });
    const docker = this.detectList(corpus, {
      docker: ['dockerfile', 'docker-compose', 'docker'],
    });
    const kubernetes = this.detectList(corpus, {
      kubernetes: ['kubernetes', 'k8s', 'helm', 'kubectl'],
    });
    const authentication = this.detectList(corpus, {
      jwt: ['jwt', 'json web token'],
      oauth: ['oauth', 'oauth2'],
      passport: ['passport'],
      auth0: ['auth0'],
    });

    const technologies = this.unique([
      ...frameworks,
      ...libraries,
      ...databases,
      ...cloudProviders,
      ...cicd,
      ...docker,
      ...kubernetes,
      ...authentication,
      ...topics,
    ]);

    const riskScore = Math.min(
      1,
      (changeSignals.securityCount * 0.2 +
        changeSignals.bugFixCount * 0.05 +
        relationships.length * 0.01) /
        5,
    );
    const confidenceScore = Math.min(
      1,
      0.25 +
        frameworks.length * 0.05 +
        modules.length * 0.03 +
        (repository.documentation.length > 0 ? 0.15 : 0) +
        (stack.frameworks.length > 0 ? 0.2 : 0),
    );

    const result: HeuristicExtractionResult = {
      languages,
      frameworks,
      libraries,
      dependencies: this.unique([...frameworks, ...libraries, ...stack.other]),
      databases,
      cloudProviders,
      cicd: this.unique([...cicd, ...docker, ...kubernetes]),
      modules,
      topics,
      technologies,
      featureCount: changeSignals.featureCount,
      bugFixCount: changeSignals.bugFixCount,
      refactorCount: changeSignals.refactorCount,
      securityCount: changeSignals.securityCount,
      performanceCount: changeSignals.performanceCount,
      riskScore: Number(riskScore.toFixed(3)),
      confidenceScore: Number(confidenceScore.toFixed(3)),
      folderStructure: {
        modules,
        authentication,
        docker,
        kubernetes,
        docCount: repository.documentation.length,
        sourceCount: sources.length,
        ownership: this.inferOwnership(sources.map((s) => s.path ?? '')),
      },
      relationships,
      rawSignals: {
        commitSample: commits.length,
        prSample: pullRequests.length,
        issueSample: issues.length,
        releaseSample: releases.length,
        authentication,
        docker,
        kubernetes,
      },
      contentChecksum: createHash('sha256').update(corpus).digest('hex'),
    };

    await this.prisma.heuristicMetadata.upsert({
      where: { repositoryId },
      create: {
        workspaceId: repository.workspaceId,
        repositoryId,
        ...this.toPrismaFields(result),
      },
      update: this.toPrismaFields(result),
    });

    return result;
  }

  private toPrismaFields(result: HeuristicExtractionResult) {
    return {
      languages: result.languages,
      frameworks: result.frameworks,
      libraries: result.libraries,
      dependencies: result.dependencies,
      databases: result.databases,
      cloudProviders: result.cloudProviders,
      cicd: result.cicd,
      modules: result.modules,
      topics: result.topics,
      technologies: result.technologies,
      featureCount: result.featureCount,
      bugFixCount: result.bugFixCount,
      refactorCount: result.refactorCount,
      securityCount: result.securityCount,
      performanceCount: result.performanceCount,
      riskScore: result.riskScore,
      confidenceScore: result.confidenceScore,
      folderStructure: result.folderStructure as Prisma.InputJsonValue,
      relationships: result.relationships as Prisma.InputJsonValue,
      rawSignals: result.rawSignals as Prisma.InputJsonValue,
      contentChecksum: result.contentChecksum,
    };
  }

  private readStack(metadata: unknown): {
    frameworks: string[];
    libraries: string[];
    other: string[];
  } {
    if (!metadata || typeof metadata !== 'object') {
      return { frameworks: [], libraries: [], other: [] };
    }
    const stack = (metadata as Record<string, unknown>).stack;
    if (!stack || typeof stack !== 'object') {
      return { frameworks: [], libraries: [], other: [] };
    }
    const obj = stack as Record<string, unknown>;
    const mapNames = (value: unknown) =>
      Array.isArray(value)
        ? value
            .map((item) =>
              item && typeof item === 'object'
                ? unknownToString((item as Record<string, unknown>).name)
                : '',
            )
            .filter(Boolean)
        : [];
    return {
      frameworks: mapNames(obj.frameworks),
      libraries: mapNames(obj.libraries),
      other: mapNames(obj.otherDependencies),
    };
  }

  private matchKnownPackages(
    corpus: string,
    category: 'framework' | 'library',
  ): string[] {
    const found: string[] = [];
    for (const [pkg, meta] of Object.entries(KNOWN_NPM_PACKAGES)) {
      if (meta.category !== category) continue;
      if (corpus.includes(pkg.toLowerCase()) || corpus.includes(meta.name)) {
        found.push(meta.name);
      }
    }
    return found;
  }

  private detectTopics(corpus: string): string[] {
    const topics: string[] = [];
    for (const [topic, keywords] of Object.entries(AI_TOPIC_KEYWORDS)) {
      if (keywords.some((k) => corpus.includes(k))) topics.push(topic);
    }
    return topics;
  }

  private detectModules(paths: string[], corpus: string): string[] {
    const modules = new Set<string>();
    for (const moduleName of KNOWN_PROJECT_MODULES) {
      if (
        paths.some((p) => p.toLowerCase().includes(`/modules/${moduleName}`)) ||
        corpus.includes(`${moduleName} module`)
      ) {
        modules.add(moduleName);
      }
    }
    for (const path of paths) {
      const match = /modules\/([a-z0-9-_]+)/i.exec(path);
      if (match?.[1]) modules.add(match[1]);
    }
    return [...modules];
  }

  private detectRelationships(
    corpus: string,
    pullRequests: Array<{ number: number; title: string }>,
    issues: Array<{ number: number; title: string }>,
    commits: Array<{ sha: string; message: string }>,
  ) {
    const refs = [...corpus.matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
    const relationships: Array<Record<string, string>> = [];
    for (const number of [...new Set(refs)].slice(0, 30)) {
      const pr = pullRequests.find((p) => p.number === number);
      const issue = issues.find((i) => i.number === number);
      if (pr) {
        relationships.push({
          type: 'related_pull_request',
          externalRefId: String(number),
          title: pr.title,
        });
      }
      if (issue) {
        relationships.push({
          type: 'related_issue',
          externalRefId: String(number),
          title: issue.title,
        });
      }
    }
    for (const commit of commits.slice(0, 20)) {
      if (/#\d+/.test(commit.message)) {
        relationships.push({
          type: 'commit_reference',
          externalRefId: commit.sha.slice(0, 7),
          title: commit.message.slice(0, 120),
        });
      }
    }
    return relationships;
  }

  private classifyChanges(messages: string[]) {
    let featureCount = 0;
    let bugFixCount = 0;
    let refactorCount = 0;
    let securityCount = 0;
    let performanceCount = 0;
    for (const message of messages) {
      const lower = message.toLowerCase();
      if (/(feat|feature|add\b)/.test(lower)) featureCount += 1;
      if (/(fix|bug|hotfix)/.test(lower)) bugFixCount += 1;
      if (/(refactor|cleanup|chore)/.test(lower)) refactorCount += 1;
      if (/(security|auth|cve|xss|csrf)/.test(lower)) securityCount += 1;
      if (/(perf|performance|optim)/.test(lower)) performanceCount += 1;
    }
    return {
      featureCount,
      bugFixCount,
      refactorCount,
      securityCount,
      performanceCount,
    };
  }

  private detectLanguages(corpus: string): string[] {
    const map: Record<string, string[]> = {
      TypeScript: ['typescript', '.ts', '.tsx'],
      JavaScript: ['javascript', '.js', '.jsx'],
      Python: ['python', '.py'],
      Go: ['golang', '.go'],
      Rust: ['rust', '.rs'],
      Java: ['java', '.java'],
    };
    return this.detectList(corpus, map);
  }

  private detectList(
    corpus: string,
    dictionary: Record<string, string[]>,
  ): string[] {
    const found: string[] = [];
    for (const [name, keywords] of Object.entries(dictionary)) {
      if (keywords.some((k) => corpus.includes(k))) found.push(name);
    }
    return found;
  }

  private inferOwnership(paths: string[]): Record<string, string[]> {
    const ownership: Record<string, Set<string>> = {};
    for (const path of paths) {
      const normalized = path.replace(/\\/g, '/');
      const parts = normalized.split('/').filter(Boolean);
      if (parts.length < 2) continue;
      const folder = parts.slice(0, Math.min(3, parts.length - 1)).join('/');
      const leaf = parts[parts.length - 1];
      if (!ownership[folder]) ownership[folder] = new Set();
      ownership[folder].add(leaf);
    }
    return Object.fromEntries(
      Object.entries(ownership)
        .slice(0, 40)
        .map(([folder, files]) => [folder, [...files].slice(0, 20)]),
    );
  }

  private unique(values: string[]): string[] {
    return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
  }
}
