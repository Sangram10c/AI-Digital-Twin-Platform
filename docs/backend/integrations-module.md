# Integrations Module

> **Status:** ✅ Complete  
> **Source Directory:** `apps/backend/src/modules/integrations/`

---

## 1. Overview

The `IntegrationsModule` provides centralized management and connectivity for third-party developer platforms (GitHub, GitLab, Bitbucket, Jira, Slack). It handles connected account registration, credentials lifecycle, health status, and permission scoping across workspaces.

---

## 2. Structure

```text
src/modules/integrations/
├── integrations.controller.ts  # Integration listing & connection management
├── integrations.module.ts      # NestJS module
├── integrations.service.ts     # Integrations orchestration logic
├── constants/
├── dto/
├── interfaces/
└── types/
```

---

## 3. Database Models

- **`GitProvider` (`git_providers`)**: Registered provider configurations (e.g. GitHub, GitLab).
- **`ConnectedAccount` (`connected_accounts`)**: User/workspace linked provider credentials with status tracking.
- **`OAuthToken` (`oauth_tokens`)**: Encrypted access/refresh tokens.

---

## 4. Current & Planned Integrations

| Provider      | Type           | Status                                |
| ------------- | -------------- | ------------------------------------- |
| **GitHub**    | Git & Issues   | ✅ Complete (OAuth + Sync + Webhooks) |
| **GitLab**    | Git & CI       | ⬜ Planned                            |
| **Bitbucket** | Git            | ⬜ Planned                            |
| **Jira**      | Issue Tracking | ⬜ Planned                            |
| **Slack**     | Communication  | ⬜ Planned                            |
