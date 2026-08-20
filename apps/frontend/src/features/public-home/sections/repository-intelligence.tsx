'use client';

import { motion } from 'framer-motion';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { homeContent } from '@/content/home';

export function RepositoryIntelligenceSection() {
  const { projectIntelligence } = homeContent;

  const healthIndicators = [
    {
      label: 'Project Sync',
      status: 'Up to date (Real-time)',
      color: 'bg-emerald-400',
      glow: 'shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    },
    {
      label: 'Knowledge Items',
      status: '1,842 Knowledge Items',
      color: 'bg-blue-400',
      glow: 'shadow-[0_0_8px_rgba(96,165,250,0.8)]',
    },
    {
      label: 'Smart Search',
      status: 'Active & Searchable',
      color: 'bg-purple-400',
      glow: 'shadow-[0_0_8px_rgba(192,132,252,0.8)]',
    },
    {
      label: 'Concept Matching',
      status: 'High Accuracy',
      color: 'bg-cyan-400',
      glow: 'shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    },
    {
      label: 'AI Assistant',
      status: 'Ready for Questions',
      color: 'bg-emerald-400',
      glow: 'shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    },
  ];

  const recentCommits = [
    {
      sha: '7f9a2b1',
      msg: 'Add smart search query builder for projects',
      author: '@alex',
      time: '12m ago',
    },
    {
      sha: '3c8e4d2',
      msg: 'Speed up background project synchronization',
      author: '@marcus',
      time: '1h ago',
    },
    {
      sha: '1e5f8a9',
      msg: 'Update session authentication and token refresh',
      author: '@sarah',
      time: '3h ago',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 w-full space-y-12" id="repo-intelligence">
      {/* Section Header */}
      <FadeIn className="text-center space-y-3 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {projectIntelligence.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {projectIntelligence.title}
          <span className="ai-gradient-text">{projectIntelligence.titleHighlight}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {projectIntelligence.subtitle}
        </p>
      </FadeIn>

      {/* Realistic Dashboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Project Overview (7 cols) */}
        <MotionCard
          spotlightColor="rgba(59, 130, 246, 0.15)"
          className="lg:col-span-7 p-6 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 font-mono text-sm font-bold">
                📦
              </div>
              <div>
                <CardTitle className="text-base font-mono text-white">
                  {projectIntelligence.projectTitle}
                </CardTitle>
                <CardDescription className="text-xs font-mono text-slate-400">
                  {projectIntelligence.projectSubtitle}
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Live Synchronized
            </Badge>
          </div>

          {/* Health Indicators Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {projectIntelligence.healthTitle}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {healthIndicators.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${item.color} ${item.glow} animate-pulse`}
                  />
                  <div className="min-w-0">
                    <div className="text-slate-400 text-[10px] truncate">{item.label}</div>
                    <div className="font-semibold text-white font-mono text-[11px] truncate">
                      {item.status}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Ingested Changes */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {projectIntelligence.recentActivityTitle}
            </span>
            <div className="space-y-2">
              {recentCommits.map((c, idx) => (
                <motion.div
                  key={c.sha}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ x: 3 }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 text-xs hover:border-slate-700 transition-colors font-mono"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-blue-400 font-bold">{c.sha}</span>
                    <span className="text-slate-200 truncate font-sans">{c.msg}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                    <span>{c.author}</span>
                    <span>•</span>
                    <span>{c.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </MotionCard>

        {/* Right Column: Knowledge Readiness & Security (5 cols) */}
        <MotionCard
          spotlightColor="rgba(168, 85, 247, 0.15)"
          className="lg:col-span-5 p-6 space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <CardTitle className="text-sm text-white">Project Knowledge Readiness</CardTitle>
              <Badge variant="outline" size="sm" className="border-slate-700 text-slate-300">
                100% Ready
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Project Code & Modules</span>
                  <span className="text-[10px] font-mono text-slate-400">All Modules Indexed</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Documentation & Notes</span>
                  <span className="text-[10px] font-mono text-slate-400">Connected & Synced</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Past Changes & PR History</span>
                  <span className="text-[10px] font-mono text-slate-400">Complete History</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '98%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>🔒 Protected Workspace Boundaries</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Only members invited to your workspace can search or ask questions about your
              connected projects.
            </p>
          </div>
        </MotionCard>
      </div>
    </section>
  );
}
