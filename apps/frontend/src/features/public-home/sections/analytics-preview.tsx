'use client';

import * as React from 'react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/motion/fade-in';
import { MetricCard } from '../components/metric-card';
import { homeContent } from '@/content/home';

export function AnalyticsPreviewSection() {
  const [activeDay, setActiveDay] = React.useState<string>('Fri');
  const { analyticsPreview } = homeContent;

  const metrics = [
    {
      title: 'Connected Projects',
      value: '8',
      change: '+2 this month',
      trend: 'up' as const,
      subtitle: 'Live synced projects',
    },
    {
      title: 'Knowledge Indexed',
      value: '14,820',
      change: '+18.4%',
      trend: 'up' as const,
      subtitle: 'Files, PRs & notes',
    },
    {
      title: 'Questions Answered',
      value: '3,492',
      change: '+24.1%',
      trend: 'up' as const,
      subtitle: '100% verified citations',
    },
    {
      title: 'Search Queries',
      value: '12,940',
      change: '< 45ms avg response',
      trend: 'up' as const,
      subtitle: 'Instant concept matching',
    },
  ];

  const weeklyActivity = [
    { day: 'Mon', queries: 480, syncs: 120, latency: 42 },
    { day: 'Tue', queries: 620, syncs: 145, latency: 38 },
    { day: 'Wed', queries: 790, syncs: 190, latency: 41 },
    { day: 'Thu', queries: 710, syncs: 160, latency: 39 },
    { day: 'Fri', queries: 850, syncs: 210, latency: 36 },
    { day: 'Sat', queries: 280, syncs: 80, latency: 34 },
    { day: 'Sun', queries: 320, syncs: 90, latency: 35 },
  ];

  const maxVal = 1000;
  const activeData = weeklyActivity.find((d) => d.day === activeDay) || weeklyActivity[4];

  return (
    <section className="mx-auto max-w-7xl px-4 w-full space-y-12" id="analytics-preview">
      {/* Section Header */}
      <FadeIn className="text-center space-y-3 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {analyticsPreview.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {analyticsPreview.title}
          <span className="ai-gradient-text">{analyticsPreview.titleHighlight}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {analyticsPreview.subtitle}
        </p>
      </FadeIn>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard
            key={m.title}
            title={m.title}
            value={m.value}
            change={m.change}
            trend={m.trend}
            subtitle={m.subtitle}
          />
        ))}
      </div>

      {/* Chart Preview & Activity Insights Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Weekly Team Activity Chart (8 cols) */}
        <Card className="lg:col-span-8 p-6 space-y-6 bg-[#0b101f] border border-slate-800/80 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <CardTitle className="text-sm text-white">{analyticsPreview.chartTitle}</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {analyticsPreview.chartSubtitle}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />{' '}
                Questions
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />{' '}
                Syncs
              </span>
            </div>
          </div>

          {/* Active Data Spotlight Banner */}
          <div className="flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Active Day:</span>
              <span className="font-bold text-white">{activeData.day}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400 font-bold">{activeData.queries} questions</span>
              <span className="text-purple-400 font-bold">{activeData.syncs} syncs</span>
              <span className="text-emerald-400 font-bold">{activeData.latency}ms avg speed</span>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="relative h-60 w-full pt-4 pb-2 px-2 select-none">
            {/* Background Horizontal Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-slate-800 w-full flex justify-between text-[9px] font-mono text-slate-500">
                <span>1000</span>
              </div>
              <div className="border-b border-slate-800 w-full flex justify-between text-[9px] font-mono text-slate-500">
                <span>750</span>
              </div>
              <div className="border-b border-slate-800 w-full flex justify-between text-[9px] font-mono text-slate-500">
                <span>500</span>
              </div>
              <div className="border-b border-slate-800 w-full flex justify-between text-[9px] font-mono text-slate-500">
                <span>250</span>
              </div>
              <div className="border-b border-slate-800 w-full flex justify-between text-[9px] font-mono text-slate-500">
                <span>0</span>
              </div>
            </div>

            {/* Bars & Interactive Columns */}
            <div className="relative z-10 h-full flex items-end justify-between gap-3 sm:gap-6 pt-4">
              {weeklyActivity.map((item) => {
                const queryHeight = Math.round((item.queries / maxVal) * 100);
                const syncHeight = Math.round((item.syncs / maxVal) * 100);
                const isSelected = activeDay === item.day;

                return (
                  <div
                    key={item.day}
                    onClick={() => setActiveDay(item.day)}
                    onMouseEnter={() => setActiveDay(item.day)}
                    className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end cursor-pointer group"
                  >
                    {/* Dual Bars Container */}
                    <div className="w-full flex items-end justify-center gap-1.5 h-44 pb-1">
                      {/* Query Bar */}
                      <div
                        style={{ height: `${queryHeight}%` }}
                        className={`w-full max-w-[24px] rounded-t-md transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-t from-blue-600 via-cyan-400 to-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.6)] brightness-125'
                            : 'bg-gradient-to-t from-blue-700 to-cyan-500 opacity-75 group-hover:opacity-100 group-hover:brightness-110'
                        }`}
                      />

                      {/* Syncs Bar */}
                      <div
                        style={{ height: `${syncHeight * 2.8}%` }}
                        className={`w-full max-w-[14px] rounded-t-sm transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-t from-purple-800 to-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                            : 'bg-gradient-to-t from-purple-900 to-purple-600 opacity-60 group-hover:opacity-90'
                        }`}
                      />
                    </div>

                    {/* Day Label */}
                    <span
                      className={`text-[11px] font-mono transition-colors ${
                        isSelected
                          ? 'text-cyan-400 font-bold'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Right: Real-time Activity Summary (4 cols) */}
        <Card className="lg:col-span-4 p-6 space-y-4 bg-[#0b101f] border border-slate-800/80 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <CardTitle className="text-sm text-white">{analyticsPreview.metricsTitle}</CardTitle>
              <Badge variant="ai" size="sm">
                Live Stats
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-400">
              {analyticsPreview.metricsSubtitle}
            </CardDescription>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 font-mono">Average Response Speed</span>
                <span className="font-mono font-bold text-emerald-400">38ms</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 font-mono">Answer Verification Rate</span>
                <span className="font-mono font-bold text-cyan-400">100%</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 font-mono">Sync Success Rate</span>
                <span className="font-mono font-bold text-purple-400">99.98%</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 font-mono">Active Workspaces</span>
                <span className="font-mono font-bold text-white">12</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 font-mono text-center border-t border-slate-800">
            Updated in real time across active workspaces
          </div>
        </Card>
      </div>
    </section>
  );
}
