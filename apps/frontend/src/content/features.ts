/**
 * Features Page Marketing Content
 * Simple, human, benefit-first descriptions of every product capability.
 */

export interface FeaturePillar {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  icon: string;
  previewType: 'chat' | 'search' | 'timeline' | 'graph' | 'analytics' | 'security';
}

export interface FeaturesContent {
  header: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
  };
  pillars: FeaturePillar[];
  callout: {
    title: string;
    subtitle: string;
    cta: string;
  };
}

export const featuresContent: FeaturesContent = {
  header: {
    badge: 'Core Capabilities',
    title: 'Everything You Need to Understand ',
    titleHighlight: 'Your Software',
    subtitle:
      'Explore features designed to save hours of searching, explain complex projects, and keep your team aligned.',
  },
  pillars: [
    {
      id: 'understand',
      badge: 'Project Understanding',
      title: 'Understand Your Projects in One Place',
      subtitle: 'No more digging through hundreds of files to understand how a service works.',
      description:
        'Your Digital Twin maps out your software, its components, and how they relate to each other so anyone can get up to speed quickly.',
      benefits: [
        'See project structure and major modules at a glance',
        'Discover where key features and logic are implemented',
        'Onboard new team members in hours instead of weeks',
      ],
      icon: '🏛️',
      previewType: 'graph',
    },
    {
      id: 'ask',
      badge: 'Natural Language AI',
      title: 'Ask Questions Naturally',
      subtitle: 'Get clear, helpful answers in plain English directly from your project.',
      description:
        'Ask about features, past decisions, or how specific workflows operate. Every answer references real files and changes so you can double-check the details.',
      benefits: [
        'Ask anything in conversational English without special query syntax',
        'Answers link directly to exact files, lines, and discussions',
        'Never rely on outdated memory or lost tribal knowledge',
      ],
      icon: '💬',
      previewType: 'chat',
    },
    {
      id: 'search',
      badge: 'Smart Search',
      title: 'Find Information Faster',
      subtitle: 'Search by concept, keyword, or past conversation.',
      description:
        'Whether you remember an exact function name or just the concept of what it does, smart search connects what you mean with the right files and notes.',
      benefits: [
        'Search across code, documentation, and pull requests simultaneously',
        'Find things even when you do not remember the exact filename',
        'Save frequently used searches for quick access later',
      ],
      icon: '🔍',
      previewType: 'search',
    },
    {
      id: 'timeline',
      badge: 'Change Tracking',
      title: 'See What Is Changing in Real Time',
      subtitle: 'Follow the evolution of your project without getting lost in commit diffs.',
      description:
        'Follow major milestones, feature launches, and pull requests in a clean chronological timeline that explains what changed and why.',
      benefits: [
        'View the story of your project from the first commit to today',
        'Understand why specific architectural choices were made',
        'Review merged pull requests with human-friendly summaries',
      ],
      icon: '⏳',
      previewType: 'timeline',
    },
    {
      id: 'insights',
      badge: 'Helpful Insights',
      title: 'Learn From Your Project Activity',
      subtitle: 'See how your projects grow and how your team interacts with knowledge.',
      description:
        'Gain visibility into top queried areas, frequently updated files, and team collaboration trends to identify areas that need clearer documentation.',
      benefits: [
        'Identify complex parts of your project that generate the most questions',
        'Track how much time your team saves using your Digital Twin',
        'Keep tabs on active workspaces and connected tools',
      ],
      icon: '📊',
      previewType: 'analytics',
    },
    {
      id: 'security',
      badge: 'Privacy & Control',
      title: 'Complete Workspace & Access Control',
      subtitle: 'Your software remains protected by strict boundaries.',
      description:
        'Manage permissions by team role, keep different workspaces completely separated, and ensure only authorized members can view project information.',
      benefits: [
        'Separate client or team projects into dedicated workspaces',
        'Assign Owner, Admin, Member, or Viewer roles easily',
        'Never expose sensitive project data across workspace borders',
      ],
      icon: '🛡️',
      previewType: 'security',
    },
  ],
  callout: {
    title: 'Ready to give your software a Digital Twin?',
    subtitle: 'Connect your first project in less than two minutes.',
    cta: 'Get Started Free',
  },
};
