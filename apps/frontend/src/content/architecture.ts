/**
 * Architecture Page Content
 * Progressive disclosure: simple data flow at the top, deep technical specifications below.
 */

export interface ArchitectureLayer {
  step: number;
  phase: string;
  humanTitle: string;
  humanDescription: string;
  technicalDetails: {
    component: string;
    description: string;
    technologies: string[];
  };
}

export interface ArchitectureContent {
  header: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
  };
  overview: {
    title: string;
    description: string;
    flow: { label: string; action: string; icon: string }[];
  };
  layers: ArchitectureLayer[];
  technicalStack: {
    category: string;
    technology: string;
    role: string;
  }[];
  securityArchitecture: {
    title: string;
    description: string;
    points: string[];
  };
}

export const architectureContent: ArchitectureContent = {
  header: {
    badge: 'System Architecture',
    title: 'How Your Information Moves Through the ',
    titleHighlight: 'Platform',
    subtitle:
      'A clear look at how your project files and updates are turned into verified answers, from simple overview to technical implementation.',
  },
  overview: {
    title: 'The Six Stages of Project Understanding',
    description:
      'Information moves through a continuous six-stage pipeline that guarantees every AI response is verified against real project sources.',
    flow: [
      { label: '1. Connect', action: 'Link your GitHub project', icon: '🔗' },
      { label: '2. Organize', action: 'Extract code, PRs, and notes', icon: '📦' },
      { label: '3. Understand', action: 'Build the semantic knowledge map', icon: '🧠' },
      { label: '4. Search', action: 'Find relevant files and changes', icon: '🔍' },
      { label: '5. Answer', action: 'Generate answers with exact citations', icon: '💬' },
      { label: '6. Learn', action: 'Aggregate insights and stay up to date', icon: '📊' },
    ],
  },
  layers: [
    {
      step: 1,
      phase: 'INGESTION',
      humanTitle: 'Connect & Keep Fresh',
      humanDescription:
        'When you link a project or push a new change, the platform reads the new updates in the background without slowing down your team.',
      technicalDetails: {
        component: 'Repository Synchronization Engine',
        description:
          'Webhook events and scheduled synchronization jobs process commit diffs, branches, pull requests, and markdown documents asynchronously.',
        technologies: ['GitHub Octokit API', 'BullMQ Queue Engine', 'Redis Queue Store'],
      },
    },
    {
      step: 2,
      phase: 'PROCESSING',
      humanTitle: 'Structure & Organize',
      humanDescription:
        'Files are broken down into logical sections such as functions, components, and documentation topics rather than raw lines of text.',
      technicalDetails: {
        component: 'Knowledge Normalization & AST Chunking',
        description:
          'Syntax tree parsers extract symbols, type definitions, and dependencies into normalized knowledge chunks with line number metadata.',
        technologies: ['TypeScript AST Parsers', 'Markdown Tokenizers', 'Prisma ORM'],
      },
    },
    {
      step: 3,
      phase: 'INDEXING',
      humanTitle: 'Semantic Understanding',
      humanDescription:
        'Each piece of your project is mapped so the platform understands concepts, synonyms, and relationships between files.',
      technicalDetails: {
        component: 'Vector Embedding Pipeline',
        description:
          'High-dimensional vector representations are generated and stored in a specialized index for rapid cosine similarity calculation.',
        technologies: ['pgvector Extension', 'HNSW Vector Indexes', 'PostgreSQL 16'],
      },
    },
    {
      step: 4,
      phase: 'RETRIEVAL',
      humanTitle: 'Smart Hybrid Search',
      humanDescription:
        'When you ask a question, the platform combines keyword matching with conceptual search to find the most relevant information.',
      technicalDetails: {
        component: 'Hybrid Search & Reciprocal Rank Fusion (RRF)',
        description:
          'Blends pgvector semantic similarity with PostgreSQL full-text keyword search (tsvector) using reciprocal rank fusion.',
        technologies: ['Reciprocal Rank Fusion (RRF)', 'PostgreSQL Full-Text Search', 'pgvector'],
      },
    },
    {
      step: 5,
      phase: 'SYNTHESIS',
      humanTitle: 'Verified Answer Generation',
      humanDescription:
        'The AI reviews the retrieved project pieces and writes a clear answer, including direct clickable citations to every file used.',
      technicalDetails: {
        component: '10-Step RAG & Citation Engine',
        description:
          'Constructs bounded prompt context from retrieved chunks and streams LLM output with validated commit SHAs and line references.',
        technologies: [
          'Server-Sent Events (SSE)',
          'AI Provider Abstraction',
          'Citation Persistence',
        ],
      },
    },
    {
      step: 6,
      phase: 'TELEMETRY',
      humanTitle: 'Continuous Insights',
      humanDescription:
        'The platform tracks which parts of your project receive questions, response latency, and system health in real-time.',
      technicalDetails: {
        component: '8-Domain Analytics Aggregator',
        description:
          'Background workers aggregate telemetry across repositories, token consumption, RAG precision, and query frequency into Redis caches.',
        technologies: ['Redis Time-Series Caches', 'BullMQ Aggregators', 'PostgreSQL Telemetry'],
      },
    },
  ],
  technicalStack: [
    {
      category: 'Backend Framework',
      technology: 'NestJS 11 + TypeScript',
      role: 'Domain-oriented modular monolith backend',
    },
    {
      category: 'Relational Database',
      technology: 'PostgreSQL 16',
      role: 'Primary data store with ACID transactional safety',
    },
    {
      category: 'Vector Search',
      technology: 'pgvector (HNSW)',
      role: 'High-speed semantic cosine distance indexing',
    },
    {
      category: 'Queue & Background Jobs',
      technology: 'BullMQ + Redis',
      role: 'Asynchronous event ingestion and embedding pipelines',
    },
    {
      category: 'ORM & Migrations',
      technology: 'Prisma ORM',
      role: 'Type-safe database modeling and schema migrations',
    },
    {
      category: 'Frontend Application',
      technology: 'Next.js 16 + React 19',
      role: 'App Router web application with Framer Motion animations',
    },
  ],
  securityArchitecture: {
    title: 'Zero-Trust Architectural Isolation',
    description:
      'Every request passes through strict tenant guards ensuring workspace and repository boundaries are never crossed.',
    points: [
      'Workspace data never crosses into other organizations or tenants.',
      'API keys and LLM credentials remain strictly on the backend with zero frontend exposure.',
      'Token rotation and session validation protect every API call.',
      'Every response citation is verified against real stored database records to prevent hallucinations.',
    ],
  },
};
