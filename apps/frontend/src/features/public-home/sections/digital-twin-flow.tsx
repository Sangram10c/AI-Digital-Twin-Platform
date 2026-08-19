'use client';

import { motion } from 'framer-motion';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { homeContent } from '@/content/home';

export function DigitalTwinFlowSection() {
  const { transformation } = homeContent;

  return (
    <section className="mx-auto max-w-7xl px-4 w-full space-y-12" id="transformation">
      {/* Section Header */}
      <FadeIn className="text-center space-y-3 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {transformation.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {transformation.title}
          <span className="ai-gradient-text">{transformation.titleHighlight}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {transformation.subtitle}
        </p>
      </FadeIn>

      {/* Interactive Dual-Side Transformation Display */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
        {/* Left Side: Scattered Project Files */}
        <MotionCard
          spotlightColor="rgba(100, 116, 139, 0.15)"
          className="lg:col-span-5 p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-foreground text-base">
                📁
              </div>
              <div>
                <CardTitle className="text-sm">{transformation.leftSideTitle}</CardTitle>
                <CardDescription className="text-[11px]">
                  {transformation.leftSideSubtitle}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" size="sm">
              Before
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {transformation.leftItems.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-900/50"
              >
                <span className="text-lg">{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.count}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </MotionCard>

        {/* Center: Transformation Bridge with Rotating Energy Beam */}
        <div className="lg:col-span-1 flex lg:flex-col items-center justify-center gap-3 py-2">
          <div className="h-[2px] lg:h-12 w-12 lg:w-[2px] bg-gradient-to-r lg:bg-gradient-to-b from-blue-500/30 to-purple-500/80" />
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
              scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-purple-500/50 bg-purple-950/40 text-purple-400 text-base font-black shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            ⚡
          </motion.div>
          <div className="h-[2px] lg:h-12 w-12 lg:w-[2px] bg-gradient-to-r lg:bg-gradient-to-b from-purple-500/80 to-blue-500/30" />
        </div>

        {/* Right Side: Living Digital Twin */}
        <MotionCard
          spotlightColor="rgba(168, 85, 247, 0.2)"
          className="lg:col-span-5 p-6 space-y-5 border-purple-500/40 shadow-xl glow-ai"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-400 text-base">
                🧠
              </div>
              <div>
                <CardTitle className="text-sm text-white">
                  {transformation.rightSideTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {transformation.rightSideSubtitle}
                </CardDescription>
              </div>
            </div>
            <Badge variant="ai" size="sm">
              Unified Twin
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {transformation.rightItems.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-purple-500/20 bg-purple-950/20 transition-all hover:bg-purple-900/30"
              >
                <span className="text-lg">{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{item.label}</div>
                  <div className="text-[10px] text-purple-400 font-mono truncate">
                    {item.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </MotionCard>
      </div>
    </section>
  );
}
