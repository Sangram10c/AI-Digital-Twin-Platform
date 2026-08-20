import Link from 'next/link';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { featuresContent } from '@/content/features';

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 space-y-16">
      {/* Header */}
      <FadeIn className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {featuresContent.header.badge}
        </Badge>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-5xl tracking-tight">
          {featuresContent.header.title}
          <span className="ai-gradient-text">{featuresContent.header.titleHighlight}</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {featuresContent.header.subtitle}
        </p>
      </FadeIn>

      {/* Feature Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuresContent.pillars.map((pillar) => (
          <MotionCard
            key={pillar.id}
            spotlightColor="rgba(59, 130, 246, 0.14)"
            className="flex flex-col justify-between p-6 space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xl">
                  {pillar.icon}
                </div>
                <Badge size="sm" variant="outline" className="border-slate-700 text-slate-300">
                  {pillar.badge}
                </Badge>
              </div>

              <div>
                <CardTitle className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  {pillar.title}
                </CardTitle>
                <div className="text-xs text-blue-400 font-mono mt-0.5">{pillar.subtitle}</div>
              </div>

              <CardDescription className="text-xs text-slate-400 leading-relaxed">
                {pillar.description}
              </CardDescription>

              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                {pillar.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/40">
              <Link
                href="/register"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group-hover:translate-x-0.5"
              >
                Try in your workspace →
              </Link>
            </div>
          </MotionCard>
        ))}
      </div>

      {/* Callout */}
      <FadeIn className="text-center p-8 sm:p-12 rounded-2xl bg-[#0b101f] border border-slate-800 shadow-2xl space-y-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {featuresContent.callout.title}
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          {featuresContent.callout.subtitle}
        </p>
        <div className="pt-2">
          <Link href="/register">
            <Button size="lg" variant="ai">
              {featuresContent.callout.cta}
            </Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
