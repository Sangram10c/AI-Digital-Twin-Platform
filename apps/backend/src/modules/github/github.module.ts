import { Module } from '@nestjs/common';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { GithubApiClient } from './services/github-api.client';
import { GithubAuditService } from './services/github-audit.service';
import { GithubOAuthStateService } from './services/github-oauth-state.service';
import { OAuthTokenEncryptionService } from './services/oauth-token-encryption.service';
import { OAuthTokenStorageService } from './services/oauth-token-storage.service';
import { GithubWorkspaceGuard } from './guards/github-workspace.guard';

@Module({
  controllers: [GithubController],
  providers: [
    GithubService,
    GithubApiClient,
    GithubAuditService,
    GithubOAuthStateService,
    OAuthTokenEncryptionService,
    OAuthTokenStorageService,
    GithubWorkspaceGuard,
  ],
  exports: [
    GithubService,
    GithubWorkspaceGuard,
    GithubApiClient,
    OAuthTokenStorageService,
  ],
})
export class GithubModule {}
