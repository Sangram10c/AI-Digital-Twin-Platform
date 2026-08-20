/**
 * Home Page Marketing Content
 * Benefit-first, simple, human language for developers and non-technical decision makers.
 */

export interface HomeCapability {
  id: string;
  category: string;
  title: string;
  description: string;
  badge?: string | null;
  href: string;
}

export interface HomeProcessStep {
  step: number;
  title: string;
  summary: string;
  benefit: string;
  icon: string;
}

export interface HomePreviewItem {
  title: string;
  description: string;
  badge?: string;
  actionText?: string;
  actionHref?: string;
}

export interface HomeContent {
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  liveDemo: {
    title: string;
    caption: string;
    question: string;
    answer: string;
    citations: { index: number; label: string; detail: string }[];
  };
  suite: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: HomeCapability[];
  };
  howItWorks: {
    badge: string;
    title: string;
    subtitle: string;
    steps: HomeProcessStep[];
  };
  transformation: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    leftSideTitle: string;
    leftSideSubtitle: string;
    leftItems: { label: string; count: string; icon: string }[];
    rightSideTitle: string;
    rightSideSubtitle: string;
    rightItems: { label: string; status: string; icon: string }[];
  };
  chatPreview: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    question: string;
    answerSummary: string;
    sourcesTitle: string;
    sourcesCaption: string;
  };
  projectIntelligence: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    projectTitle: string;
    projectSubtitle: string;
    healthTitle: string;
    recentActivityTitle: string;
  };
  analyticsPreview: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    chartTitle: string;
    chartSubtitle: string;
    metricsTitle: string;
    metricsSubtitle: string;
  };
  security: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    isolationTitle: string;
    ctaText: string;
    ctaHref: string;
  };
  audience: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
  };
  finalCta: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    footnote: string;
  };
}

export const homeContent: HomeContent = {
  hero: {
    badge: 'Intelligent Project Assistant',
    title: 'Your Projects, Understood by ',
    titleHighlight: 'AI.',
    subtitle:
      'Connect your software projects, keep your knowledge in one place, and ask questions in plain language with verified answers.',
    primaryCta: 'Get Started Free',
    secondaryCta: 'Explore the Platform',
  },
  liveDemo: {
    title: 'Live Verified Conversation',
    caption: 'Answers grounded in your actual project history',
    question: 'How does user login work in this project, and where is the token saved?',
    answer:
      'User login is handled through secure token rotation with short-lived session tokens and protected cookies. Token invalidation on logout is processed automatically.',
    citations: [
      { index: 1, label: 'auth.service.ts', detail: 'Line 45-89' },
      { index: 2, label: 'jwt.strategy.ts', detail: 'Line 20-44' },
      { index: 3, label: 'Pull Request #14', detail: 'Session token rotation' },
    ],
  },
  suite: {
    eyebrow: 'The AI Digital Twin Suite',
    title: 'Four capabilities that work together seamlessly.',
    subtitle: 'Everything your team needs to understand, search, and preserve project knowledge.',
    items: [
      {
        id: 'graph',
        category: 'STRUCTURE',
        title: 'Project Knowledge Graph',
        description:
          'Your codebase and documentation structured into an easy-to-explore map of your software.',
        badge: null,
        href: '#transformation',
      },
      {
        id: 'context',
        category: 'HISTORY',
        title: 'Context & Decisions',
        description:
          'Understand the "why" behind changes, architectural decisions, and team discussions over time.',
        badge: null,
        href: '#chat-citations',
      },
      {
        id: 'docs',
        category: 'DOCUMENTS',
        title: 'Connected Documentation',
        description:
          'Keep documentation, guides, and project notes automatically connected to the actual code.',
        badge: 'LIVE',
        href: '#how-it-works',
      },
      {
        id: 'agents',
        category: 'ASSISTANTS',
        title: 'AI & Developer Tools',
        description:
          'Connect your favorite coding tools and AI assistants directly to your verified project knowledge.',
        badge: 'SOON',
        href: '#integrations',
      },
    ],
  },
  howItWorks: {
    badge: 'How It Works',
    title: 'How Your Digital Twin Is Built',
    subtitle: 'A straightforward journey from your project history to clear, helpful answers.',
    steps: [
      {
        step: 1,
        title: 'Connect your project',
        summary: 'Link your repository with a single click.',
        benefit: 'Works with your existing project structure effortlessly.',
        icon: '🔗',
      },
      {
        step: 2,
        title: 'Bring your knowledge together',
        summary: 'Automatically organize code, changes, and documentation.',
        benefit: 'No more manual wiki updates or outdated notes.',
        icon: '📦',
      },
      {
        step: 3,
        title: 'Ask questions in plain language',
        summary: 'Ask about architecture, features, or past decisions.',
        benefit: 'Get up to speed on any part of the project instantly.',
        icon: '💬',
      },
      {
        step: 4,
        title: 'Get clear, verifiable answers',
        summary: 'Every answer references the exact files and pull requests.',
        benefit: 'Know exactly where information came from without guessing.',
        icon: '✅',
      },
      {
        step: 5,
        title: 'Keep everything up to date',
        summary: 'Your digital twin updates automatically as your team works.',
        benefit: 'Always fresh, always accurate knowledge for the whole team.',
        icon: '🔄',
      },
    ],
  },
  transformation: {
    badge: 'Unified Knowledge',
    title: 'Turn Scattered Projects Into a ',
    titleHighlight: 'Living Digital Twin',
    subtitle:
      'Bring together code, documentation, and past decisions into a single reliable source of truth.',
    leftSideTitle: 'Scattered Project Files',
    leftSideSubtitle: 'Spread across repositories, pull requests, and wiki pages',
    leftItems: [
      { label: 'Source Code Files', count: '142 Files', icon: '📄' },
      { label: 'Project History', count: '1,280 Updates', icon: '🌳' },
      { label: 'Reviewed Changes', count: '64 Pull Requests', icon: '🔀' },
      { label: 'Team Discussions', count: '89 Solved Issues', icon: '💬' },
      { label: 'Architecture Notes', count: '18 Documents', icon: '📚' },
      { label: 'Version Releases', count: '12 Milestones', icon: '🏷️' },
    ],
    rightSideTitle: 'Your Living Digital Twin',
    rightSideSubtitle: 'Organized, searchable, and always ready to assist',
    rightItems: [
      { label: 'Clear System Overview', status: 'Connected & Ready', icon: '🏛️' },
      { label: 'Instant Search', status: 'Search files & history', icon: '🔍' },
      { label: 'Natural Language AI', status: 'Answers with citations', icon: '🤖' },
      { label: 'Project Timeline', status: 'Complete change history', icon: '⏳' },
      { label: 'Team Collaboration', status: 'Shared workspace access', icon: '👥' },
      { label: 'Useful Insights', status: 'Activity & trend metrics', icon: '📊' },
    ],
  },
  chatPreview: {
    badge: 'Ask Anything',
    title: 'Ask Questions. Get Answers You Can ',
    titleHighlight: 'Verify.',
    subtitle:
      'Your AI assistant answers from your actual project knowledge. Every statement links directly to the real files and discussions.',
    question: 'How does authentication work in this project, and what happens on logout?',
    answerSummary:
      'Authentication is handled using short-lived session tokens and protected cookies. When a user logs out, their active session is immediately closed.',
    sourcesTitle: 'Retrieved Reference Sources',
    sourcesCaption: 'Click any reference to see the exact lines in your project.',
  },
  projectIntelligence: {
    badge: 'Project Intelligence',
    title: 'Understand Your Project at a ',
    titleHighlight: 'Glance',
    subtitle: 'See project status, recent changes, and connected services in one place.',
    projectTitle: 'Core Platform Project',
    projectSubtitle: 'Main branch • Connected & up to date',
    healthTitle: 'Project Health & Status',
    recentActivityTitle: 'Recent Project Activity',
  },
  analyticsPreview: {
    badge: 'Useful Insights',
    title: 'See How Your Team and Projects ',
    titleHighlight: 'Evolve',
    subtitle:
      'Track questions asked, knowledge indexed, and time saved across all your workspaces.',
    chartTitle: 'Weekly Team Questions & Updates',
    chartSubtitle: 'Questions answered and updates synced this week',
    metricsTitle: 'Activity Summary',
    metricsSubtitle: 'Real-time workspace statistics',
  },
  security: {
    badge: 'Security & Privacy',
    title: 'Built to Keep Your Information ',
    titleHighlight: 'Protected',
    subtitle:
      'Your information stays separated by workspace and access level. Only the people you choose can view and query your projects.',
    isolationTitle: 'Complete Workspace & Access Isolation',
    ctaText: 'Learn More About Security →',
    ctaHref: '/security',
  },
  audience: {
    badge: 'For Every Team Member',
    title: 'Who Is AI Digital Twin ',
    titleHighlight: 'For?',
    subtitle: 'Designed for anyone who builds, manages, or leads software projects.',
  },
  finalCta: {
    badge: 'Start Today',
    title: 'Bring Your Project Knowledge ',
    titleHighlight: 'Together.',
    subtitle:
      'Connect your project in minutes and start exploring what your Digital Twin can help your team understand.',
    primaryCta: 'Get Started Free',
    secondaryCta: 'Explore the Platform',
    footnote: 'Free for open source and personal projects • No credit card required',
  },
};
