import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { homeContent } from '@/content/home';
import { siteContent } from '@/content/site';
import {
  HowItWorksSection,
  DigitalTwinFlowSection,
  AiChatPreviewSection,
  RepositoryIntelligenceSection,
  AnalyticsPreviewSection,
  IntegrationsSection,
  SecuritySection,
  AudienceSection,
  FinalCtaSection,
} from '@/features/public-home';

export default function LandingPage() {
  const getCapabilityIcon = (id: string) => {
    switch (id) {
      case 'graph':
        return (
          <svg
            className="h-6 w-6 text-blue-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      case 'context':
        return (
          <svg
            className="h-6 w-6 text-purple-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
          </svg>
        );
      case 'docs':
        return (
          <svg
            className="h-6 w-6 text-cyan-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
          </svg>
        );
      default:
        return (
          <svg
            className="h-6 w-6 text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v6" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l4.24 4.24" />
            <path d="M14.83 14.83l4.24 4.24" />
            <path d="M2 12h6" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l4.24-4.24" />
            <path d="M14.83 9.17l4.24-4.24" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-24 py-12 md:py-24">
      {/* 02. Hero Section */}
      <FadeIn className="mx-auto max-w-5xl px-4 text-center space-y-8">
        {/* Official Hero Logo Badge */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-card p-2 shadow-2xl glow-ai">
            <Image
              src="/logo.png"
              alt={`${siteContent.name} Logo`}
              width={80}
              height={80}
              priority
              className="h-full w-full object-cover rounded-xl"
            />
          </div>

          <div className="inline-flex items-center gap-2">
            <Badge variant="ai" size="md">
              {homeContent.hero.badge}
            </Badge>
            <span className="text-xs text-muted-foreground">• {siteContent.name}</span>
          </div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          {homeContent.hero.title}
          <span className="ai-gradient-text">{homeContent.hero.titleHighlight}</span>
        </h1>

        <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          {homeContent.hero.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg" variant="ai" className="shadow-lg">
              {homeContent.hero.primaryCta}
            </Button>
          </Link>
          <Link href="/features">
            <Button size="lg" variant="outline">
              {homeContent.hero.secondaryCta}
            </Button>
          </Link>
        </div>
      </FadeIn>

      {/* 03. Live RAG Conversation Demo */}
      <FadeIn className="mx-auto max-w-4xl px-4 w-full">
        <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-2 text-foreground font-semibold">
                {homeContent.liveDemo.title}
              </span>
            </div>
            <span>{homeContent.liveDemo.caption}</span>
          </div>
          <div className="p-5 sm:p-6 bg-[#0b101f] space-y-4">
            <div className="text-xs text-slate-300 font-mono space-y-1">
              <div className="text-slate-400">
                User: &quot;{homeContent.liveDemo.question}&quot;
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans space-y-2">
              <div className="text-purple-400 font-bold font-mono text-[11px]">Assistant:</div>
              <p>{homeContent.liveDemo.answer}</p>
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-mono">
                {homeContent.liveDemo.citations.map((c) => (
                  <span
                    key={c.index}
                    className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  >
                    [{c.index}] {c.label} ({c.detail})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* 04. Digital Twin Suite (Consumed from homeContent.suite) */}
      <section className="mx-auto max-w-7xl px-4 w-full space-y-8" id="suite">
        <FadeIn className="text-center space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {homeContent.suite.eyebrow} — {homeContent.suite.title}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {homeContent.suite.items.map((cap) => (
            <MotionCard
              key={cap.id}
              spotlightColor="rgba(59, 130, 246, 0.16)"
              className="flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Top Row: Icon + Optional Pill Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 text-lg group-hover:scale-105 transition-transform">
                    {getCapabilityIcon(cap.id)}
                  </div>
                  {cap.badge && (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        cap.badge === 'SOON'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      }`}
                    >
                      {cap.badge}
                    </span>
                  )}
                </div>

                {/* Category Subtitle */}
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                  {cap.category}
                </div>

                {/* Main Card Title */}
                <CardTitle className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  {cap.title}
                </CardTitle>

                {/* Description */}
                <CardDescription className="text-xs text-slate-400 leading-relaxed">
                  {cap.description}
                </CardDescription>
              </div>

              {/* Bottom Learn More Link */}
              <div className="pt-2 border-t border-slate-800/50">
                <Link
                  href={cap.href}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group-hover:translate-x-0.5"
                >
                  Learn more →
                </Link>
              </div>
            </MotionCard>
          ))}
        </div>
      </section>

      {/* 05. How AI Digital Twin Works */}
      <HowItWorksSection />

      {/* 06. Repository → Digital Twin Transformation */}
      <DigitalTwinFlowSection />

      {/* 07. AI Chat + Citations Product Preview */}
      <AiChatPreviewSection />

      {/* 08. Repository Intelligence Preview */}
      <RepositoryIntelligenceSection />

      {/* 09. Engineering Analytics Preview */}
      <AnalyticsPreviewSection />

      {/* 10. Integrations */}
      <IntegrationsSection />

      {/* 11. Security & Trust */}
      <SecuritySection />

      {/* 12. Who Is It For? */}
      <AudienceSection />

      {/* 13. Final CTA */}
      <FinalCtaSection />
    </div>
  );
}
