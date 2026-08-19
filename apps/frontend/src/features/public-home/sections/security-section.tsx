'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { homeContent } from '@/content/home';

export function SecuritySection() {
  const { security } = homeContent;

  const securityLayers = [
    { label: 'Authenticated Member', icon: '👤', desc: 'Secure Login Session' },
    { label: 'Workspace Boundary', icon: '🏢', desc: 'Strict Tenant Isolation' },
    { label: 'Role Access', icon: '🔒', desc: 'Role Permissions' },
    { label: 'Project Knowledge', icon: '🧠', desc: 'Verified Project Data' },
    { label: 'Protected Gateway', icon: '🛡️', desc: 'Private Backend Keys' },
  ];

  const securityPoints = [
    {
      icon: '🏢',
      title: 'Workspace Isolation',
      description: 'Workspace data never crosses into other organizations or projects.',
    },
    {
      icon: '👥',
      title: 'Role-Based Control',
      description: 'Manage who can view, search, or connect projects with role controls.',
    },
    {
      icon: '🔑',
      title: 'Protected Credentials',
      description: 'API keys and tokens stay securely on the backend with zero browser exposure.',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 w-full space-y-12" id="security">
      {/* Section Header */}
      <FadeIn className="text-center space-y-3 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {security.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {security.title}
          <span className="ai-gradient-text">{security.titleHighlight}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {security.subtitle}
        </p>
      </FadeIn>

      {/* Security Flow Card */}
      <FadeIn>
        <Card className="p-6 bg-[#0b101f] border border-slate-800/80 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-white">{security.isolationTitle}</span>
            <Badge variant="success" size="sm">
              Enforced on Every Request
            </Badge>
          </div>

          {/* Responsive Horizontal Chain */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {securityLayers.map((layer, idx) => (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5 transition-colors hover:border-emerald-500/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-primary text-lg">
                  {layer.icon}
                </div>
                <span className="text-xs font-bold text-white">{layer.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">{layer.desc}</span>
                {idx < securityLayers.length - 1 && (
                  <span className="hidden lg:block text-xs text-slate-400 font-mono mt-1">↓</span>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      </FadeIn>

      {/* 3 Core Security Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {securityPoints.map((cap) => (
          <MotionCard
            key={cap.title}
            spotlightColor="rgba(52, 211, 153, 0.12)"
            className="p-6 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xl">
                {cap.icon}
              </div>
              <CardTitle className="text-sm font-bold text-white">{cap.title}</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400 leading-relaxed">
              {cap.description}
            </CardDescription>
          </MotionCard>
        ))}
      </div>

      {/* CTA */}
      <FadeIn className="text-center pt-2">
        <Link href={security.ctaHref}>
          <Button variant="outline" size="sm" className="text-xs">
            {security.ctaText}
          </Button>
        </Link>
      </FadeIn>
    </section>
  );
}
