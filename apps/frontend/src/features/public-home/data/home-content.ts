/**
 * Structured content and mock preview data for the Public Home Page
 * All values are grounded in actual backend capabilities.
 */

export interface FlowStep {
  step: number;
  title: string;
  category: string;
  description: string;
  tech: string;
  icon: string;
}

export const HOW_IT_WORKS_STEPS: FlowStep[] = [
  {
    step: 1,
    title: 'GitHub Repository',
    category: 'Source',
    description: 'Connect repository to ingest branches, commits, PRs, issues, and code trees.',
    tech: 'GitHub App / Octokit',
    icon: '🐙',
  },
  {
    step: 2,
    title: 'Repository Sync',
    category: 'Ingestion',
    description: 'Background workers process incremental Git entity diffs without locking.',
    tech: 'BullMQ + Redis',
    icon: '⚡',
  },
  {
    step: 3,
    title: 'Knowledge Processing',
    category: 'Normalization',
    description: 'Normalized documentation and symbol-aware TypeScript/JS code chunking.',
    tech: 'Abstract Syntax Tree (AST)',
    icon: '📦',
  },
  {
    step: 4,
    title: 'Deterministic Heuristics',
    category: 'Extraction',
    description: 'Extract file structures, package dependencies, and commit author graphs.',
    tech: 'Deterministic Rules',
    icon: '🧩',
  },
  {
    step: 5,
    title: 'Vector Embeddings',
    category: 'Vectors',
    description: 'Generate 768-dimensional embeddings indexed via HNSW cosine distance.',
    tech: 'pgvector HNSW',
    icon: '🧠',
  },
  {
    step: 6,
    title: 'Hybrid Search',
    category: 'Retrieval',
    description: 'Merge vector similarity with PostgreSQL tsvector full-text search using RRF.',
    tech: 'Reciprocal Rank Fusion',
    icon: '🔍',
  },
  {
    step: 7,
    title: '10-Step RAG',
    category: 'Context',
    description: 'Synthesize grounded repository context with bounded conversation memory.',
    tech: 'Context Construction',
    icon: '⚙️',
  },
  {
    step: 8,
    title: 'Verifiable AI Answers',
    category: 'Generation',
    description: 'Stream SSE responses with exact commit SHAs, line numbers, and PR citations.',
    tech: 'LLM Abstraction Layer',
    icon: '💬',
  },
  {
    step: 9,
    title: 'Continuous Analytics',
    category: 'Telemetry',
    description: 'Aggregate 8-domain metrics across token consumption, RAG precision, and latency.',
    tech: 'BullMQ Aggregators',
    icon: '📊',
  },
];

export const REPOSITORY_TRANSFORMATION_DATA = {
  rawRepository: [
    { label: 'Code & Symbols', count: '142 Files', icon: '📄' },
    { label: 'Git Commits', count: '1,280 Commits', icon: '🌳' },
    { label: 'Pull Requests', count: '64 Merged PRs', icon: '🔀' },
    { label: 'Issue Discussions', count: '89 Closed Issues', icon: '💬' },
    { label: 'Architecture Specs', count: '18 Markdown Docs', icon: '📚' },
    { label: 'Release History', count: '12 Version Tags', icon: '🏷️' },
  ],
  digitalTwin: [
    { label: 'System Architecture', status: 'Grounded & Indexed', icon: '🏛️' },
    { label: 'Knowledge Base', status: '1,842 Chunks Embedded', icon: '🧠' },
    { label: 'Hybrid Code Search', status: 'pgvector + tsvector RRF', icon: '🔍' },
    { label: 'Engineering Timeline', status: 'Chronological Provenance', icon: '⏳' },
    { label: '10-Step AI Assistant', status: '100% Traceable Citations', icon: '🤖' },
    { label: '8-Domain Analytics', status: 'Real-time Redis Rollups', icon: '📊' },
  ],
};

export interface IntegrationProvider {
  name: string;
  category: 'Source Control' | 'AI Model Provider' | 'Local Engine';
  status: 'Native' | 'Supported' | 'Self-Hosted';
  description: string;
  icon: string;
  badge: string;
}

export const INTEGRATIONS_LIST: IntegrationProvider[] = [
  {
    name: 'GitHub',
    category: 'Source Control',
    status: 'Native',
    description: 'Webhooks, repository branches, commits, pull requests, issues, and metadata.',
    icon: '🐙',
    badge: 'OAuth App',
  },
  {
    name: 'Google Gemini',
    category: 'AI Model Provider',
    status: 'Supported',
    description: 'gemini-2.0-flash / gemini-1.5-pro for high-speed streaming and contextual RAG.',
    icon: '✨',
    badge: 'Primary Provider',
  },
  {
    name: 'Groq',
    category: 'AI Model Provider',
    status: 'Supported',
    description: 'Ultra-low latency LPU inference with llama-3.3-70b-versatile.',
    icon: '⚡',
    badge: 'Ultra Fast',
  },
  {
    name: 'OpenAI',
    category: 'AI Model Provider',
    status: 'Supported',
    description: 'gpt-4o and gpt-4o-mini with structured JSON outputs and embedding fallback.',
    icon: '🟢',
    badge: 'Enterprise',
  },
  {
    name: 'Anthropic',
    category: 'AI Model Provider',
    status: 'Supported',
    description: 'claude-3-5-sonnet for complex architectural reasoning and code reviews.',
    icon: '🟣',
    badge: 'High Reasoning',
  },
  {
    name: 'OpenRouter',
    category: 'AI Model Provider',
    status: 'Supported',
    description: 'Unified gateway access to 100+ open-source and proprietary models.',
    icon: '🌐',
    badge: 'Multi-Model',
  },
  {
    name: 'Hugging Face',
    category: 'AI Model Provider',
    status: 'Supported',
    description: 'Inference endpoints for specialized code intelligence and embeddings.',
    icon: '🤗',
    badge: 'Custom Models',
  },
  {
    name: 'Cloudflare Workers AI',
    category: 'AI Model Provider',
    status: 'Supported',
    description: 'Serverless global edge inference with minimal latency overhead.',
    icon: '☁️',
    badge: 'Edge Inference',
  },
  {
    name: 'Ollama',
    category: 'Local Engine',
    status: 'Self-Hosted',
    description: 'On-premise zero-data-leakage local models (deepseek-r1, llama3, qwen2.5-coder).',
    icon: '🦙',
    badge: '100% Private',
  },
];

export const SECURITY_CAPABILITIES = [
  {
    title: 'Workspace Isolation',
    description: 'Strict workspace boundary enforcement prevents cross-organization data leakage.',
    icon: '🏢',
  },
  {
    title: 'Repository-Level Permissions',
    description: 'Granular repository scoping ensures users only query authorized codebases.',
    icon: '🔒',
  },
  {
    title: 'Role-Based Access Control (RBAC)',
    description: 'Backend verified UserRole (ADMIN, USER, VIEWER) and WorkspaceRole access checks.',
    icon: '🛡️',
  },
  {
    title: 'Secure Token Rotation',
    description: 'Rotating JWT access & refresh tokens with Redis session blacklisting.',
    icon: '🔑',
  },
  {
    title: 'Zero Direct LLM Execution',
    description:
      'AI calls route strictly through verified backend abstractions with no leaked secrets.',
    icon: '🤖',
  },
  {
    title: 'Tamper-Proof Provenance',
    description:
      'Every answer is grounded in cryptographic Git commit SHAs and verified AST chunks.',
    icon: '📜',
  },
];

export const AUDIENCE_PERSONAS = [
  {
    role: 'Software Developer',
    subtitle: 'Code Comprehension',
    description:
      'Understand unfamiliar codebases, debug legacy services, and query past architectural decisions without digging through thousands of files.',
    icon: '💻',
    tag: 'Daily Workflow',
  },
  {
    role: 'Engineering Team',
    subtitle: 'Knowledge Preservation',
    description:
      'Eliminate knowledge silos, preserve onboarding context, and share verifiable technical documentation across repositories.',
    icon: '👥',
    tag: 'Team Collaboration',
  },
  {
    role: 'Engineering Lead',
    subtitle: 'System Provenance & Trends',
    description:
      'Gain visibility into repository activity, architectural changes, RAG usage efficiency, and sprint delivery velocity.',
    icon: '🎯',
    tag: 'Leadership & Insights',
  },
  {
    role: 'Workspace & Platform Admin',
    subtitle: 'Governance & Security',
    description:
      'Manage workspace memberships, BullMQ background queues, AI model fallback chains, and security boundaries.',
    icon: '🛡️',
    tag: 'Operations & RBAC',
  },
];
