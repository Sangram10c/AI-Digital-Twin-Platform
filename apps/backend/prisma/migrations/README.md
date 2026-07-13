# Prisma Migrations

Each migration lives in a **descriptive domain folder** with a `migration.sql` file inside.

> Apply migrations **in the order listed below**, or use `npm run db:push` for dev sync.

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
- Never edit applied migrations; always add a new domain folder.
