/**
 * Pricing Page Marketing Content
 * Clear, transparent, easily configurable pricing tier definitions.
 */

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  billingPeriod: string;
  description: string;
  badge?: string;
  highlighted?: boolean;
  features: string[];
  cta: string;
  ctaVariant: 'default' | 'outline' | 'ai';
  href: string;
}

export interface PricingContent {
  header: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
  };
  tiers: PricingTier[];
  faq: {
    question: string;
    answer: string;
  }[];
  customNeedsCallout: {
    title: string;
    description: string;
    actionText: string;
    actionHref: string;
  };
}

export const pricingContent: PricingContent = {
  header: {
    badge: 'Simple Pricing',
    title: 'Transparent Plans for Teams of ',
    titleHighlight: 'Any Size',
    subtitle:
      'Start free on your personal projects or bring your entire engineering team together with complete workspace intelligence.',
  },
  tiers: [
    {
      id: 'starter',
      name: 'Developer Free',
      price: '$0',
      billingPeriod: 'forever free',
      description:
        'Ideal for individual developers exploring project understanding on open source or personal code.',
      badge: 'Free Tier',
      highlighted: false,
      features: [
        'Up to 3 Connected Projects',
        'Ask Questions with Verified Citations',
        'Smart Keyword & Concept Search',
        'Standard Project Updates',
        'Community Support',
      ],
      cta: 'Get Started Free',
      ctaVariant: 'outline',
      href: '/register',
    },
    {
      id: 'team',
      name: 'Team Pro',
      price: '$49',
      billingPeriod: 'per workspace / month',
      description:
        'For growing engineering teams that want shared project knowledge, real-time sync, and team analytics.',
      badge: 'Most Popular',
      highlighted: true,
      features: [
        'Unlimited Connected Projects',
        'Real-time Automatic Project Sync',
        'Full Team Activity & Usage Insights',
        'Extended Question Quotas & Fast Responses',
        'Shared Workspace Member Roles',
        'Priority Sync & Processing',
      ],
      cta: 'Start Pro Workspace',
      ctaVariant: 'ai',
      href: '/register',
    },
    {
      id: 'enterprise',
      name: 'Enterprise Dedicated',
      price: 'Custom',
      billingPeriod: 'tailored setup',
      description:
        'For large organizations needing dedicated hosting, custom AI model providers, or on-premise deployments.',
      badge: 'Enterprise',
      highlighted: false,
      features: [
        'Dedicated Private Infrastructure Option',
        'On-Premise Local AI Model Support (e.g. Ollama)',
        'Custom Role-Based Access Controls',
        'Audit Log Exporting & Governance',
        'Dedicated Technical Architecture Support',
        'Service Level Agreement (SLA)',
      ],
      cta: 'Contact Us',
      ctaVariant: 'outline',
      href: '/register',
    },
  ],
  faq: [
    {
      question: 'Can I start using the platform for free?',
      answer:
        'Yes! The Developer Free tier allows you to connect up to 3 projects with verified AI answers and smart search at zero cost.',
    },
    {
      question: 'Does the AI ever invent or hallucinate answers?',
      answer:
        'Our platform requires verified citations. If the information does not exist in your connected project, the assistant will inform you rather than fabricating details.',
    },
    {
      question: 'Is my project code kept private?',
      answer:
        'Yes. Your code and knowledge are strictly isolated to your workspace. We never use your code to train public foundation models.',
    },
    {
      question: 'Can I change my plan later?',
      answer:
        'You can upgrade, downgrade, or invite additional team members to your workspace at any time directly from your workspace settings.',
    },
  ],
  customNeedsCallout: {
    title: 'Need a custom deployment or on-premise setup?',
    description:
      'We offer self-hosted Ollama local engine support and dedicated VPC hosting for high-security environments.',
    actionText: 'Contact Enterprise Support →',
    actionHref: '/register',
  },
};
