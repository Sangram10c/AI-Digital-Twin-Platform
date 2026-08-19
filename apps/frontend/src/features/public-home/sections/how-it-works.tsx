'use client';

import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/motion/fade-in';
import { MotionCard } from '@/components/motion/motion-card';
import { homeContent } from '@/content/home';

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 w-full space-y-12" id="how-it-works">
      {/* Section Header */}
      <FadeIn className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="ai" size="md">
          {homeContent.howItWorks.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {homeContent.howItWorks.title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {homeContent.howItWorks.subtitle}
        </p>
      </FadeIn>

      {/* 5-Step Journey Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {homeContent.howItWorks.steps.map((st) => (
          <MotionCard
            key={st.step}
            spotlightColor="rgba(59, 130, 246, 0.12)"
            className="p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{st.icon}</span>
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">
                  Step 0{st.step}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">{st.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{st.summary}</p>
            </div>
            <div className="pt-2 border-t border-slate-800/60 text-[11px] text-purple-400 font-mono">
              ✨ {st.benefit}
            </div>
          </MotionCard>
        ))}
      </div>
    </section>
  );
}
