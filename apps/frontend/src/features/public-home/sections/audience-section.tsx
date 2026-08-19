'use client';

import Link from 'next/link';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { homeContent } from '@/content/home';

export function AudienceSection() {
  const { audience } = homeContent;

  const personas = [
    {
      role: 'Individual Developers',
      subtitle: 'ONBOARDING & SEARCH',
      tag: 'Developers',
      icon: '💻',
      description:
        'Get up to speed on new codebases instantly, locate functions by concept, and understand why past changes were made.',
    },
    {
      role: 'Engineering Teams',
      subtitle: 'SHARED KNOWLEDGE',
      tag: 'Teams',
      icon: '👥',
      description:
        'Preserve team knowledge, review pull requests with contextual background, and eliminate repetitive Slack Q&A.',
    },
    {
      role: 'Engineering Leads & PMs',
      subtitle: 'DECISIONS & TRACKING',
      tag: 'Leadership',
      icon: '📊',
      description:
        'Follow architectural evolution, verify pull request implementations, and understand project activity at a glance.',
    },
    {
      role: 'Founders & Admins',
      subtitle: 'SCALE & GOVERNANCE',
      tag: 'Management',
      icon: '🏢',
      description:
        'Manage multiple project workspaces with strict role-based access control and zero risk of cross-workspace leakage.',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 w-full space-y-12" id="for-teams">
      {/* Section Header */}
      <FadeIn className="text-center space-y-3 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {audience.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {audience.title}
          <span className="ai-gradient-text">{audience.titleHighlight}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {audience.subtitle}
        </p>
      </FadeIn>

      {/* 4 Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {personas.map((persona) => (
          <MotionCard
            key={persona.role}
            spotlightColor="rgba(168, 85, 247, 0.14)"
            className="flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 text-xl group-hover:scale-105 transition-transform">
                  {persona.icon}
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300">
                  {persona.tag}
                </span>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                  {persona.subtitle}
                </div>
                <CardTitle className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mt-0.5">
                  {persona.role}
                </CardTitle>
              </div>

              <CardDescription className="text-xs text-slate-400 leading-relaxed">
                {persona.description}
              </CardDescription>
            </div>

            <div className="pt-2 border-t border-slate-800/50">
              <Link
                href="/register"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group-hover:translate-x-0.5"
              >
                Learn more →
              </Link>
            </div>
          </MotionCard>
        ))}
      </div>
    </section>
  );
}
