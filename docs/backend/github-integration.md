# GitHub Integration Module

## Overview

The GitHub Integration module lets users connect multiple GitHub accounts after login, then create workspaces linked to those accounts. Repository sync, webhooks, and code ingestion are out of scope for this phase.

## User Flow (Primary)

```
1. Login                    POST /api/v1/auth/login
2. Connect GitHub           GET  /api/v1/github/connect?returnUrl=true
3. Authorize on GitHub      (browser — open authorizationUrl from response)
4. List connected accounts  GET  /api/v1/github/accounts
5. Create workspace         POST /api/v1/workspaces  { name, githubTokenId }
```

Repeat steps 2–5 for additional GitHub accounts and workspaces.

### Flowchart

```mermaid
flowchart TD
  A([User opens app]) --> B[POST /auth/login]
  B --> C{JWT valid?}
  C -->|No| B
  C -->|Yes| D[GET /github/connect?returnUrl=true]

  D --> E[Backend creates signed OAuth state]
  E --> F[Returns authorizationUrl JSON]
  F --> G[User opens authorizationUrl in browser]
  G --> H[GitHub Authorize page]

  H --> I{User approves?}
  I -->|Deny| J[Redirect error URL<br/>status=error]
  I -->|Approve| K[GitHub redirects to<br/>GET /github/callback?code&state]

  K --> L[Validate state signature + expiry]
  L --> M[Exchange code for access token]
  M --> N[Fetch GitHub profile + email]
  N --> O[Encrypt token → save oauth_tokens]
  O --> P[Redirect success URL<br/>status=connected&githubTokenId=...]

  P --> Q[GET /github/accounts]
  Q --> R[Shows connected GitHub accounts<br/>id = oauthTokenId]

  R --> S[POST /workspaces<br/>name + githubTokenId]
  S --> T[Create workspace]
  T --> U[Create connected_accounts row<br/>link workspace ↔ GitHub]
  U --> V([Workspace ready on that GitHub account])

  R --> W[Connect another GitHub account]
  W --> D

  R --> X[DELETE /github/accounts/oauthTokenId]
  X --> Y[Disconnect all workspace links<br/>Delete oauth_tokens row]

  U --> Z[DELETE /github/disconnect<br/>workspaceId + accountId]
  Z --> AA[Unlink from workspace only<br/>Keep user GitHub token]
```

### Platform email vs GitHub email

Platform login email and GitHub account email **do not need to match**.

| Account                 | Purpose                  |
| ----------------------- | ------------------------ |
| Platform `users.email`  | App login identity       |
| GitHub email (metadata) | Display only after OAuth |

Accounts are linked by platform `user.id` + GitHub `provider_account_id`, not by email.

## Architecture

```
GithubController
  ├── GithubService            # OAuth, user accounts, workspace linking
  ├── GithubApiClient          # GitHub OAuth + profile HTTP calls
  ├── GithubOAuthStateService  # Signed state (CSRF protection)
  ├── OAuthTokenEncryptionService
  ├── OAuthTokenStorageService # Decrypt + future refresh hook
  └── GithubAuditService       # AuditLog persistence
```

## Database Relations

```
User 1──* OAuthToken (provider=GITHUB, unique per GitHub account)
User 1──* ConnectedAccount
Workspace 1──* ConnectedAccount *──* OAuthToken (shared across workspaces)
GitProvider (GITHUB) 1──* ConnectedAccount
```

### Key Constraints

- `OAuthToken`: unique `(userId, provider, providerAccountId)` — multiple GitHub accounts per user
- `ConnectedAccount`: unique `(workspaceId, gitProviderId, providerAccountId)` — one GitHub identity per workspace
- Same GitHub account can power multiple workspaces (shared `oauthTokenId`)

## OAuth Flow

```mermaid
sequenceDiagram
  participant U as User
  participant API as Backend
  participant GH as GitHub

  U->>API: Login (JWT)
  U->>API: GET /github/connect?returnUrl=true
  API->>API: Signed state (userId only)
  API-->>U: authorizationUrl
  U->>GH: Authorize app
  GH->>API: GET /github/callback?code&state
  API->>API: Upsert OAuthToken (encrypted)
  API-->>U: Redirect ?status=connected&githubTokenId=...
  U->>API: POST /workspaces { githubTokenId }
  API->>API: Create workspace + ConnectedAccount
```

## API Endpoints

Base path: `/api/v1/github`

| Method   | Path                                   | Auth            | Description                                           |
| -------- | -------------------------------------- | --------------- | ----------------------------------------------------- |
| `GET`    | `/connect?returnUrl=true`              | JWT             | Connect GitHub at user level                          |
| `GET`    | `/connect?workspaceId=&returnUrl=true` | JWT             | Connect and link to workspace (optional)              |
| `GET`    | `/callback`                            | Public          | OAuth callback                                        |
| `GET`    | `/accounts`                            | JWT             | List user's GitHub accounts + linked workspaces       |
| `DELETE` | `/accounts/:oauthTokenId`              | JWT             | Remove GitHub account from user (all workspace links) |
| `GET`    | `/account?workspaceId=`                | JWT + workspace | List GitHub accounts in a workspace                   |
| `DELETE` | `/disconnect?workspaceId=&accountId=`  | JWT + workspace | Unlink from workspace only                            |

### Create workspace with GitHub

```http
POST /api/v1/workspaces
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Engineering Workspace",
  "githubTokenId": "<id from GET /github/accounts>"
}
```

### Swagger tip

Use `returnUrl=true` on `/github/connect` — Swagger cannot follow redirects to GitHub.

## Migration

After pulling these changes, run:

```bash
cd apps/backend
npm run db:migrate
```

Migration `github_multi_account` enables multiple GitHub accounts per user.

## Security

- OAuth state binds `userId` (optional `workspaceId`)
- Tokens encrypted at rest (AES-256-GCM)
- Tokens never returned from APIs
- Audit logging on connect/disconnect

## Out of Scope

Repository sync, webhooks, commits, branches, pull requests, issues.
