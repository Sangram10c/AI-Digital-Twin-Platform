'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion/fade-in';
import { IntegrationCard } from '../components/integration-card';
import { integrationsContent } from '@/content/integrations';

export function IntegrationsSection() {
  const allIntegrations = integrationsContent.categories.flatMap((cat) => cat.items);

  return (
    <section className="mx-auto max-w-7xl px-4 w-full space-y-12" id="integrations">
      {/* Section Header */}
      <FadeIn className="text-center space-y-3 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {integrationsContent.header.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {integrationsContent.header.title}
          <span className="ai-gradient-text">{integrationsContent.header.titleHighlight}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {integrationsContent.header.subtitle}
        </p>
      </FadeIn>

      {/* Grid of supported integrations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {allIntegrations.map((integration) => (
          <IntegrationCard key={integration.name} integration={integration} />
        ))}
      </div>

      {/* Footer link */}
      <FadeIn className="text-center pt-2">
        <Link href="/integrations">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Explore all supported providers & integrations →
          </Button>
        </Link>
      </FadeIn>
    </section>
  );
}
