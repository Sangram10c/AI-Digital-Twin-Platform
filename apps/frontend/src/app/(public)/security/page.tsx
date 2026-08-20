import Link from 'next/link';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { securityContent } from '@/content/security';

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 space-y-16">
      {/* Header */}
      <FadeIn className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {securityContent.header.badge}
        </Badge>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-5xl tracking-tight">
          {securityContent.header.title}
          <span className="ai-gradient-text">{securityContent.header.titleHighlight}</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {securityContent.header.subtitle}
        </p>
      </FadeIn>

      {/* Security Pillars Grid */}
      <div className="space-y-6">
        <FadeIn className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {securityContent.overview.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            {securityContent.overview.description}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityContent.pillars.map((pillar) => (
            <MotionCard
              key={pillar.title}
              spotlightColor="rgba(52, 211, 153, 0.14)"
              className="p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-2xl">
                  {pillar.icon}
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white">{pillar.title}</CardTitle>
                  <div className="text-xs text-emerald-400 font-mono mt-0.5">{pillar.subtitle}</div>
                </div>
              </div>

              <CardDescription className="text-xs text-slate-400 leading-relaxed">
                {pillar.description}
              </CardDescription>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                {pillar.points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </MotionCard>
          ))}
        </div>
      </div>

      {/* Security Commitments */}
      <div className="p-8 sm:p-10 rounded-2xl bg-[#0b101f] border border-slate-800 space-y-6 shadow-xl max-w-5xl mx-auto">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white">{securityContent.commitments.title}</h2>
          <p className="text-xs text-slate-400">{securityContent.commitments.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {securityContent.commitments.items.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800"
            >
              <span className="text-xl">{item.icon}</span>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">{item.label}</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Callout */}
      <FadeIn className="text-center p-8 rounded-2xl bg-[#0b101f] border border-slate-800 space-y-3 max-w-3xl mx-auto">
        <h3 className="text-lg font-bold text-white">{securityContent.callout.title}</h3>
        <p className="text-xs text-slate-400">{securityContent.callout.description}</p>
        <div className="pt-1">
          <Link href="/register">
            <Button size="sm" variant="outline" className="text-xs">
              {securityContent.callout.cta}
            </Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
