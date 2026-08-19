/**
 * Integrations Page Marketing Content
 * Only listing actually supported integrations in the product.
 */

export interface IntegrationItem {
  name: string;
  category: 'Source Control' | 'Cloud AI Provider' | 'Local & Private AI';
  badge: string;
  description: string;
  status: string;
  icon: string;
  href: string;
}

export interface IntegrationsContent {
  header: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
  };
  categories: {
    title: string;
    description: string;
    items: IntegrationItem[];
  }[];
  customIntegrationCallout: {
    title: string;
    description: string;
    cta: string;
  };
}

export const integrationsContent: IntegrationsContent = {
  header: {
    badge: 'Connected Tools',
    title: 'Connect the Tools Your Team ',
    titleHighlight: 'Already Uses',
    subtitle:
      'Seamlessly link your GitHub repositories and choose from leading cloud AI providers or private, on-premise local models.',
  },
  categories: [
    {
      title: 'Source Control & Project Repositories',
      description:
        'Connect your codebases to trigger automatic synchronization and historical knowledge indexing.',
      items: [
        {
          name: 'GitHub',
          category: 'Source Control',
          badge: 'Native Ingestion',
          description:
            'Sync repositories, pull requests, issues, and commit histories automatically with real-time webhooks.',
          status: 'Available Now',
          icon: '🐙',
          href: '/docs',
        },
      ],
    },
    {
      title: 'Cloud AI Model Providers',
      description: 'Plug in leading AI models via our unified server-side provider abstraction.',
      items: [
        {
          name: 'Google Gemini',
          category: 'Cloud AI Provider',
          badge: 'Default Engine',
          description:
            'High-speed reasoning and deep context window support with Gemini 2.0 Flash.',
          status: 'Ready',
          icon: '✨',
          href: '/docs',
        },
        {
          name: 'Groq',
          category: 'Cloud AI Provider',
          badge: 'Ultra Fast',
          description: 'Sub-second inference responses powered by Groq LPU acceleration.',
          status: 'Ready',
          icon: '⚡',
          href: '/docs',
        },
        {
          name: 'OpenAI',
          category: 'Cloud AI Provider',
          badge: 'GPT-4o Ready',
          description: 'Industry-standard reasoning and conversational intelligence.',
          status: 'Ready',
          icon: '🟢',
          href: '/docs',
        },
        {
          name: 'Anthropic',
          category: 'Cloud AI Provider',
          badge: 'Claude 3.5 Sonnet',
          description:
            'Exceptional code comprehension, nuanced reasoning, and architectural clarity.',
          status: 'Ready',
          icon: '🟣',
          href: '/docs',
        },
        {
          name: 'OpenRouter',
          category: 'Cloud AI Provider',
          badge: 'Multi-Model Routing',
          description:
            'Access dozens of open and commercial models through a single managed endpoint.',
          status: 'Ready',
          icon: '🌐',
          href: '/docs',
        },
        {
          name: 'Hugging Face',
          category: 'Cloud AI Provider',
          badge: 'Open Models',
          description: 'Inference endpoints for leading open-source foundation models.',
          status: 'Ready',
          icon: '🤗',
          href: '/docs',
        },
        {
          name: 'Cloudflare Workers AI',
          category: 'Cloud AI Provider',
          badge: 'Edge Hosted',
          description: 'Globally distributed serverless AI inference on Cloudflare edge network.',
          status: 'Ready',
          icon: '☁️',
          href: '/docs',
        },
      ],
    },
    {
      title: 'Private & Local AI Engines',
      description: 'Zero data leakage solutions for high-compliance enterprise environments.',
      items: [
        {
          name: 'Ollama',
          category: 'Local & Private AI',
          badge: 'Self-Hosted',
          description:
            'Run open-weight models (Llama 3, DeepSeek, Qwen) completely locally with zero outbound data transfer.',
          status: 'Ready',
          icon: '🦙',
          href: '/docs',
        },
      ],
    },
  ],
  customIntegrationCallout: {
    title: 'Need a custom AI provider or internal Git hosting?',
    description:
      'Our backend provider architecture supports pluggable custom endpoints for GitLab, Bitbucket, and private LLM gateways.',
    cta: 'Explore Provider Documentation →',
  },
};
