'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { homeContent } from '@/content/home';

export function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 w-full py-12" id="get-started">
      <FadeIn>
        <MotionCard
          spotlightColor="rgba(59, 130, 246, 0.22)"
          className="relative overflow-hidden border border-primary/40 p-8 sm:p-12 text-center shadow-2xl glow-ai space-y-8"
        >
          {/* Top Logo Badge */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <Logo size="md" showText={false} priority />
            <Badge variant="ai" size="sm">
              {homeContent.finalCta.badge}
            </Badge>
          </div>

          {/* Headings */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">
              {homeContent.finalCta.title}
              <span className="ai-gradient-text">{homeContent.finalCta.titleHighlight}</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {homeContent.finalCta.subtitle}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/register">
              <Button size="lg" variant="ai" className="shadow-xl">
                {homeContent.finalCta.primaryCta}
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline">
                {homeContent.finalCta.secondaryCta}
              </Button>
            </Link>
          </div>

          <div className="pt-4 text-xs text-muted-foreground font-mono">
            {homeContent.finalCta.footnote}
          </div>
        </MotionCard>
      </FadeIn>
    </section>
  );
}
