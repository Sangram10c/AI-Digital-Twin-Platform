import { Injectable } from '@nestjs/common';
import {
  Commit,
  Documentation,
  Issue,
  KnowledgeSourceType,
  PullRequest,
  Release,
  Repository,
  Review,
} from '@prisma/client';
import {
  DetectedLanguageKind,
  KnowledgeProcessingMetadata,
  NormalizedKnowledgeDocument,
} from '../interfaces/knowledge.interfaces';
import { KnowledgeDocumentKind } from '../interfaces/knowledge.interfaces';

@Injectable()
export class MetadataExtractorService {
  fromRepository(
    repository: Repository,
    rawContent: string,
  ): NormalizedKnowledgeDocument {
    const metadata: KnowledgeProcessingMetadata = {
      documentType: 'repository_metadata',
      repositoryLanguage: repository.language ?? undefined,
      branch: repository.defaultBranch,
      sourceCreatedAt: repository.createdAt.toISOString(),
      sourceUpdatedAt: repository.updatedAt.toISOString(),
      detectedLanguage: repository.language ?? 'text',
      languageKind: DetectedLanguageKind.NATURAL,
    };

    return {
      documentKind: KnowledgeDocumentKind.SOURCE,
      workspaceId: repository.workspaceId,
      repositoryId: repository.id,
      sourceType: KnowledgeSourceType.REPOSITORY,
      externalRefId: repository.providerRepositoryId,
      internalRefId: repository.id,
      title: repository.fullName,
      rawContent,
      url: repository.url ?? undefined,
      metadata,
    };
  }

  fromCommit(
    commit: Commit,
    repository: Repository,
  ): NormalizedKnowledgeDocument {
    const metadata: KnowledgeProcessingMetadata = {
      documentType: 'commit',
      author: commit.authorName ?? commit.authorEmail ?? undefined,
      commitSha: commit.sha,
      branch: commit.branchId ?? undefined,
      sourceCreatedAt: commit.committedAt.toISOString(),
      sourceUpdatedAt: commit.updatedAt.toISOString(),
      repositoryLanguage: repository.language ?? undefined,
    };

    return {
      documentKind: KnowledgeDocumentKind.SOURCE,
      workspaceId: repository.workspaceId,
      repositoryId: repository.id,
      sourceType: KnowledgeSourceType.COMMIT,
      externalRefId: commit.sha,
      internalRefId: commit.id,
      title: `Commit ${commit.sha.slice(0, 7)}: ${this.firstLine(commit.message)}`,
      rawContent: this.formatCommitContent(commit),
      metadata,
    };
  }

  fromPullRequest(
    pullRequest: PullRequest,
    repository: Repository,
    reviews: Review[] = [],
  ): NormalizedKnowledgeDocument {
    const labels = this.extractLabels(pullRequest.providerMetadata);
    const metadata: KnowledgeProcessingMetadata = {
      documentType: 'pull_request',
      author: pullRequest.authorUsername,
      prNumber: pullRequest.number,
      branch: pullRequest.sourceBranch,
      labels,
      sourceCreatedAt: pullRequest.openedAt.toISOString(),
      sourceUpdatedAt: pullRequest.updatedAt.toISOString(),
      repositoryLanguage: repository.language ?? undefined,
    };

    return {
      documentKind: KnowledgeDocumentKind.SOURCE,
      workspaceId: repository.workspaceId,
      repositoryId: repository.id,
      sourceType: KnowledgeSourceType.PULL_REQUEST,
      externalRefId: String(pullRequest.number),
      internalRefId: pullRequest.id,
      title: `PR #${pullRequest.number}: ${pullRequest.title}`,
      rawContent: this.formatPullRequestContent(pullRequest, reviews),
      metadata,
    };
  }

  fromReview(
    review: Review,
    pullRequest: PullRequest,
    repository: Repository,
  ): NormalizedKnowledgeDocument {
    const metadata: KnowledgeProcessingMetadata = {
      documentType: 'review',
      author: review.reviewerUsername,
      prNumber: pullRequest.number,
      sourceCreatedAt: review.submittedAt?.toISOString(),
      sourceUpdatedAt: review.updatedAt.toISOString(),
      repositoryLanguage: repository.language ?? undefined,
    };

    return {
      documentKind: KnowledgeDocumentKind.SOURCE,
      workspaceId: repository.workspaceId,
      repositoryId: repository.id,
      sourceType: KnowledgeSourceType.CUSTOM,
      externalRefId: `review:${review.id}`,
      internalRefId: review.id,
      title: `Review on PR #${pullRequest.number} by ${review.reviewerUsername}`,
      rawContent: this.formatReviewContent(review, pullRequest),
      metadata,
    };
  }

  fromIssue(issue: Issue, repository: Repository): NormalizedKnowledgeDocument {
    const labels = this.extractLabels(issue.providerMetadata);
    const metadata: KnowledgeProcessingMetadata = {
      documentType: 'issue',
      author: issue.authorUsername,
      issueNumber: issue.number,
      labels,
      sourceCreatedAt: issue.openedAt.toISOString(),
      sourceUpdatedAt: issue.updatedAt.toISOString(),
      repositoryLanguage: repository.language ?? undefined,
    };

    return {
      documentKind: KnowledgeDocumentKind.SOURCE,
      workspaceId: repository.workspaceId,
      repositoryId: repository.id,
      sourceType: KnowledgeSourceType.ISSUE,
      externalRefId: String(issue.number),
      internalRefId: issue.id,
      title: `Issue #${issue.number}: ${issue.title}`,
      rawContent: this.formatIssueContent(issue),
      metadata,
    };
  }

  fromRelease(
    release: Release,
    repository: Repository,
  ): NormalizedKnowledgeDocument {
    const metadata: KnowledgeProcessingMetadata = {
      documentType: 'release',
      branch: release.tagName,
      sourceCreatedAt: release.publishedAt?.toISOString(),
      sourceUpdatedAt: release.updatedAt.toISOString(),
      repositoryLanguage: repository.language ?? undefined,
    };

    return {
      documentKind: KnowledgeDocumentKind.SOURCE,
      workspaceId: repository.workspaceId,
      repositoryId: repository.id,
      sourceType: KnowledgeSourceType.RELEASE,
      externalRefId: release.tagName,
      internalRefId: release.id,
      title: release.name ?? `Release ${release.tagName}`,
      rawContent: this.formatReleaseContent(release),
      metadata,
    };
  }

  fromDocumentation(
    documentation: Documentation,
    repository: Repository,
  ): NormalizedKnowledgeDocument {
    const metadata: KnowledgeProcessingMetadata = {
      documentType: documentation.type.toLowerCase(),
      filePath: documentation.filePath ?? undefined,
      sourceCreatedAt: documentation.createdAt.toISOString(),
      sourceUpdatedAt: documentation.updatedAt.toISOString(),
      repositoryLanguage: repository.language ?? undefined,
    };

    return {
      documentKind: KnowledgeDocumentKind.DOCUMENTATION,
      workspaceId: repository.workspaceId,
      repositoryId: repository.id,
      documentationType: documentation.type,
      externalRefId: documentation.filePath ?? documentation.id,
      internalRefId: documentation.id,
      title: documentation.title,
      rawContent: documentation.content ?? '',
      path: documentation.filePath ?? undefined,
      metadata,
    };
  }

  private firstLine(message: string): string {
    return message.split('\n')[0]?.trim() ?? message;
  }

  private formatCommitContent(commit: Commit): string {
    const parts = [
      `# Commit ${commit.sha}`,
      '',
      `Author: ${commit.authorName ?? 'Unknown'} <${commit.authorEmail ?? 'unknown'}>`,
      `Date: ${commit.committedAt.toISOString()}`,
      '',
      commit.message,
    ];

    if (commit.additions || commit.deletions || commit.changedFiles) {
      parts.push(
        '',
        `Stats: +${commit.additions ?? 0} -${commit.deletions ?? 0} (${commit.changedFiles ?? 0} files)`,
      );
    }

    return parts.join('\n');
  }

  private formatPullRequestContent(
    pullRequest: PullRequest,
    reviews: Review[],
  ): string {
    const parts = [
      `# Pull Request #${pullRequest.number}: ${pullRequest.title}`,
      '',
      `Author: ${pullRequest.authorUsername}`,
      `State: ${pullRequest.state}`,
      `Branches: ${pullRequest.sourceBranch} → ${pullRequest.targetBranch}`,
      '',
      pullRequest.body ?? '',
    ];

    if (reviews.length > 0) {
      parts.push('', '## Reviews');
      for (const review of reviews) {
        parts.push(
          '',
          `### ${review.reviewerUsername} (${review.state})`,
          review.body ?? '',
        );
      }
    }

    return parts.join('\n');
  }

  private formatReviewContent(
    review: Review,
    pullRequest: PullRequest,
  ): string {
    return [
      `# Review on PR #${pullRequest.number}`,
      '',
      `Reviewer: ${review.reviewerUsername}`,
      `State: ${review.state}`,
      '',
      review.body ?? '',
    ].join('\n');
  }

  private formatIssueContent(issue: Issue): string {
    return [
      `# Issue #${issue.number}: ${issue.title}`,
      '',
      `Author: ${issue.authorUsername}`,
      `State: ${issue.state}`,
      '',
      issue.body ?? '',
    ].join('\n');
  }

  private formatReleaseContent(release: Release): string {
    return [
      `# Release ${release.tagName}`,
      '',
      release.name ? `Name: ${release.name}` : '',
      release.body ?? '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private extractLabels(providerMetadata: unknown): string[] | undefined {
    if (!providerMetadata || typeof providerMetadata !== 'object') {
      return undefined;
    }
    const labels = (providerMetadata as { labels?: Array<{ name?: string }> })
      .labels;
    if (!Array.isArray(labels)) return undefined;
    const names = labels
      .map((label) => label.name)
      .filter((name): name is string => Boolean(name));
    return names.length > 0 ? names : undefined;
  }
}
