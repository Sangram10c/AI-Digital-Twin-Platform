/**
 * Documentation Page Content
 * Clear developer guides, API references, and conceptual walkthroughs.
 */

export interface DocCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  articles: { title: string; slug: string; time: string; badge?: string }[];
}

export interface DocumentationContent {
  header: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
  };
  searchPlaceholder: string;
  categories: DocCategory[];
  quickStart: {
    title: string;
    steps: { step: number; title: string; detail: string }[];
  };
}

export const documentationContent: DocumentationContent = {
  header: {
    badge: 'Documentation & Guides',
    title: 'Developer Guides & ',
    titleHighlight: 'Documentation',
    subtitle:
      'Learn how to connect repositories, configure workspace roles, query your digital twin, and integrate with backend APIs.',
  },
  searchPlaceholder: 'Search documentation guides, APIs, and workflows...',
  quickStart: {
    title: 'Quick Start in 3 Minutes',
    steps: [
      {
        step: 1,
        title: 'Create a Workspace',
        detail: 'Sign up and create an isolated workspace for your team or personal projects.',
      },
      {
        step: 2,
        title: 'Link a Repository',
        detail: 'Connect your GitHub repository to trigger initial knowledge indexing.',
      },
      {
        step: 3,
        title: 'Ask Questions',
        detail: 'Open the Chat panel and ask anything about your architecture or history.',
      },
    ],
  },
  categories: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Account setup, creating workspaces, and connecting your first project.',
      icon: '🚀',
      articles: [
        { title: 'Platform Overview & Concepts', slug: 'overview', time: '3 min read' },
        { title: 'Creating Your First Workspace', slug: 'create-workspace', time: '2 min read' },
        { title: 'Connecting a GitHub Repository', slug: 'connect-github', time: '4 min read' },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      description: 'Understanding knowledge indexing, vector search, and citation grounding.',
      icon: '🧠',
      articles: [
        {
          title: 'The 10-Step RAG Retrieval Process',
          slug: 'rag-process',
          time: '5 min read',
          badge: 'Core',
        },
        {
          title: 'How Citations & Sources Are Verified',
          slug: 'citation-verification',
          time: '4 min read',
        },
        {
          title: 'Incremental Ingestion & Synchronization',
          slug: 'incremental-sync',
          time: '3 min read',
        },
      ],
    },
    {
      id: 'workspace',
      title: 'Using Your Workspace',
      description: 'Managing team members, roles, settings, and workspace privacy.',
      icon: '🏢',
      articles: [
        {
          title: 'Managing Team Roles & Permissions',
          slug: 'roles-permissions',
          time: '4 min read',
        },
        {
          title: 'Workspace Isolation & Boundaries',
          slug: 'workspace-isolation',
          time: '3 min read',
        },
        { title: 'Inviting Collaborators', slug: 'inviting-collaborators', time: '2 min read' },
      ],
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant & Chat',
      description: 'Best practices for conversational queries and architectural questions.',
      icon: '💬',
      articles: [
        { title: 'Effective Query Prompting', slug: 'query-prompting', time: '4 min read' },
        {
          title: 'Interpreting Source Citations',
          slug: 'interpreting-citations',
          time: '3 min read',
        },
        { title: 'Session History & Memory Scope', slug: 'session-history', time: '3 min read' },
      ],
    },
    {
      id: 'search-insights',
      title: 'Search & Insights',
      description: 'Using smart search filters and analyzing engineering telemetry.',
      icon: '📊',
      articles: [
        { title: 'Hybrid Keyword & Concept Search', slug: 'hybrid-search', time: '3 min read' },
        {
          title: 'Reading Workspace Analytics & Trends',
          slug: 'reading-analytics',
          time: '4 min read',
        },
        { title: 'Exporting Activity Logs', slug: 'exporting-logs', time: '2 min read' },
      ],
    },
    {
      id: 'integrations-api',
      title: 'Integrations & API',
      description: 'Connecting AI model providers and integrating backend webhooks.',
      icon: '🔌',
      articles: [
        { title: 'Configuring AI Model Providers', slug: 'ai-providers', time: '5 min read' },
        {
          title: 'Self-Hosting with Local Ollama',
          slug: 'ollama-self-hosted',
          time: '6 min read',
          badge: 'Advanced',
        },
        { title: 'REST API Authentication & Endpoints', slug: 'rest-api', time: '7 min read' },
      ],
    },
  ],
};
