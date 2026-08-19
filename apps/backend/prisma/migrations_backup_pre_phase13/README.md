# Prisma Migrations

Each migration lives in a **descriptive domain folder** with a `migration.sql` file inside.

> Apply migrations **in the order listed below**, or use `npm run db:push` for local/dev sync.

## Production warning

Prisma `migrate deploy` applies folders in **lexicographic order**. Domain-only names
(`ai_domain` before `identity_domain`) **break dependency order**.

**Recommended fix (manual — do not rename casually in shared environments):**

```
20260715120000_identity_domain
20260715130000_workspace_domain
20260715140000_git_integration_domain
20260715150000_repository_domain
20260715160000_knowledge_domain
20260715170000_ai_domain
20260715180000_search_platform_domain
```

Until folders are timestamp-prefixed, use `db:push` for development only.
For CI / production, run `npm run db:migrate:deploy` only after renaming.

## Migration order

| #   | Folder                   | Domain                                                                                                                    |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | `identity_domain`        | User, Session, RefreshToken, OAuthToken                                                                                   |
| 2   | `workspace_domain`       | Workspace, WorkspaceSettings, WorkspaceMember                                                                             |
| 3   | `git_integration_domain` | GitProvider, ConnectedAccount, WebhookEvent, SyncHistory                                                                  |
| 4   | `repository_domain`      | Repository, Branch, Commit, PullRequest, Review, Issue, Release, Tag, RepositoryContributor, RepositoryStatistics         |
| 5   | `knowledge_domain`       | KnowledgeSource, Documentation, KnowledgeChunk, Embedding, Citation                                                       |
| 6   | `ai_domain`              | Conversation, Message, AIResponse, PromptHistory, ModelUsage, ConversationMemory, PinnedConversation                      |
| 7   | `search_platform_domain` | SearchHistory, SavedSearch, SearchCache, Notification, NotificationPreference, AuditLog, AnalyticsSnapshot, BackgroundJob |

## Rules

- Apply migrations in order.
- The SQL file inside each folder must be named `migration.sql`.
- Never edit applied migrations; always add a new domain folder (or a new timestamped migration).
