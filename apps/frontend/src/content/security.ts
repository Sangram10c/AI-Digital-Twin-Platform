/**
 * Security Page Marketing Content
 * Clear, trustworthy, human-understandable security principles.
 */

export interface SecurityPillar {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  points: string[];
}

export interface SecurityContent {
  header: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
  };
  overview: {
    title: string;
    description: string;
  };
  pillars: SecurityPillar[];
  commitments: {
    title: string;
    description: string;
    items: { label: string; detail: string; icon: string }[];
  };
  callout: {
    title: string;
    description: string;
    cta: string;
  };
}

export const securityContent: SecurityContent = {
  header: {
    badge: 'Security & Trust',
    title: 'How We Protect Your ',
    titleHighlight: 'Project Data',
    subtitle:
      'Source code and engineering history are your most sensitive assets. We design every layer with strict isolation and access controls.',
  },
  overview: {
    title: 'Built Around Four Security Invariants',
    description:
      'We treat security as an architectural boundary, not an afterthought. Your data remains isolated, verifiable, and strictly controlled by your team.',
  },
  pillars: [
    {
      icon: '🏢',
      title: 'Workspace Isolation',
      subtitle: 'Keep workspaces completely separated.',
      description:
        'Every workspace operates in an isolated tenant boundary. Project files, conversations, search results, and citations in Workspace A can never cross into Workspace B.',
      points: [
        'Strict tenant-scoped database queries on every API request',
        'Search indices and vectors never mix across workspaces',
        'Automatic validation on every retrieval and chat operation',
      ],
    },
    {
      icon: '👥',
      title: 'Role-Based Access Control',
      subtitle: 'Control who can see your projects.',
      description:
        'Manage permissions by team role. Choose who can add repositories, invite members, view analytics, or query project intelligence.',
      points: [
        'Built-in roles: Owner, Admin, Member, and Viewer',
        'Backend route guards enforce authorization before executing queries',
        'Instantly revoke access when team members change roles',
      ],
    },
    {
      icon: '🔑',
      title: 'Protected Credentials',
      subtitle: 'Connect services securely.',
      description:
        'API keys and access tokens are managed securely on the backend and are never sent to browser clients or stored in git repositories.',
      points: [
        'All AI provider API keys remain server-side only',
        'Protected session tokens with automatic refresh rotation',
        'Zero credential logging or sensitive payload exposure',
      ],
    },
    {
      icon: '🛡️',
      title: 'No Public Model Training',
      subtitle: 'Your code stays your code.',
      description:
        'We never use your source code or project conversations to train public foundation models. Your project knowledge is used strictly to answer your questions.',
      points: [
        'Zero public training on your proprietary code',
        'Optional on-premise local AI model support (Ollama)',
        'Full data ownership and deletion upon workspace closure',
      ],
    },
  ],
  commitments: {
    title: 'Our Security Guarantees',
    description: 'Practical, verifiable standards we uphold across every feature we build.',
    items: [
      {
        label: 'Encrypted in Transit',
        detail:
          'All data transferred between your browser and platform uses modern TLS 1.3 encryption.',
        icon: '🔒',
      },
      {
        label: 'Verifiable Citations',
        detail:
          'Every AI response must link to real stored project files, preventing fabricated answers.',
        icon: '✅',
      },
      {
        label: 'Session Invalidation',
        detail: 'Logging out invalidates active tokens immediately across all devices.',
        icon: '🚪',
      },
      {
        label: 'Export & Portability',
        detail: 'Download or delete your indexed project data at any time from workspace settings.',
        icon: '📥',
      },
    ],
  },
  callout: {
    title: 'Have specific compliance or enterprise security questions?',
    description: 'Learn more about our dedicated VPC hosting and on-premise deployment options.',
    cta: 'Contact Security Team →',
  },
};
