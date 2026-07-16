# GitHub OAuth

## Purpose

Describe how the platform authenticates users against GitHub and stores encrypted access tokens.

## Scope

- User-level GitHub connect (multiple accounts per user)
- Optional immediate workspace link via `workspaceId` on connect
- Workspace link via `githubTokenId` when creating a workspace

## Overview

After platform login (JWT), the user starts OAuth with `GET /api/v1/github/connect`. GitHub redirects to `GET /api/v1/github/callback`. The backend stores an encrypted `OAuthToken` and redirects the browser to the frontend success URL with `githubTokenId`.

## Responsibilities

| Component                     | Responsibility                         |
| ----------------------------- | -------------------------------------- |
| `GithubController`            | HTTP routes                            |
| `GithubService`               | Orchestration, link/unlink             |
| `GithubApiClient`             | Calls GitHub authorize/token/user APIs |
| `GithubOAuthStateService`     | CSRF-safe signed `state`               |
| `OAuthTokenEncryptionService` | AES-256-GCM                            |
| `GithubAuditService`          | Audit logs                             |

## Design

### Endpoints

| Method | Path                                    | Auth            |
| ------ | --------------------------------------- | --------------- |
| GET    | `/api/v1/github/connect`                | JWT             |
| GET    | `/api/v1/github/callback`               | Public          |
| GET    | `/api/v1/github/accounts`               | JWT             |
| DELETE | `/api/v1/github/accounts/:oauthTokenId` | JWT             |
| GET    | `/api/v1/github/account?workspaceId=`   | JWT + workspace |
| DELETE | `/api/v1/github/disconnect`             | JWT + workspace |

### External GitHub calls (free)

- `GET https://github.com/login/oauth/authorize`
- `POST https://github.com/login/oauth/access_token`
- `GET https://api.github.com/user`
- `GET https://api.github.com/user/emails`

### Security

- Signed OAuth `state` with expiry
- Tokens encrypted at rest; never returned in API JSON
- Scopes from `GITHUB_OAUTH_SCOPES` (default `read:user user:email`)

### Env

See `apps/backend/.env.example` (`GITHUB_CLIENT_*`, `GITHUB_CALLBACK_URL`, redirects, `OAUTH_TOKEN_ENCRYPTION_KEY`).

## Code locations

`apps/backend/src/modules/github/`

## Future Improvements

- Broader scopes when full private-repo crawl is restored
- Token refresh handling when GitHub App / refresh tokens are used

## References

- [Backend GitHub module doc](../backend/github-integration.md)
- [GitHub OAuth docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
