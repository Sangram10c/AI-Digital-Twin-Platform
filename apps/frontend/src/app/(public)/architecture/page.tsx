import Link from 'next/link';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { architectureContent } from '@/content/architecture';

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 space-y-16">
      {/* Header */}
      <FadeIn className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {architectureContent.header.badge}
        </Badge>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-5xl tracking-tight">
          {architectureContent.header.title}
          <span className="ai-gradient-text">{architectureContent.header.titleHighlight}</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {architectureContent.header.subtitle}
        </p>
      </FadeIn>

      {/* Six Stage Flow (Human Understandable Top Half) */}
      <div className="space-y-6">
        <FadeIn className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {architectureContent.overview.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            {architectureContent.overview.description}
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {architectureContent.overview.flow.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl border border-slate-800 bg-[#0b101f] text-center space-y-2"
            >
              <div className="text-2xl">{item.icon}</div>
              <div className="text-xs font-bold text-white">{item.label}</div>
              <div className="text-[11px] text-slate-400 leading-tight">{item.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progressive Deep Dive Layers */}
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-2">
          <h2 className="text-xl font-bold text-white">
            Pipeline Architecture & Component Details
          </h2>
          <p className="text-xs text-slate-400">
            Step-by-step breakdown of backend components and technologies.
          </p>
        </div>

        <div className="space-y-4">
          {architectureContent.layers.map((layer) => (
            <MotionCard
              key={layer.step}
              spotlightColor="rgba(59, 130, 246, 0.12)"
              className="p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-950 border border-blue-800 text-blue-400 font-mono text-xs font-bold">
                    0{layer.step}
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white">
                      {layer.humanTitle}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {layer.humanDescription}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  size="sm"
                  className="font-mono text-[10px] border-slate-700 text-slate-300"
                >
                  {layer.phase}
                </Badge>
              </div>

              {/* Technical Specifications */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-purple-400 font-mono">
                  ⚙️ {layer.technicalDetails.component}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {layer.technicalDetails.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {layer.technicalDetails.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </MotionCard>
          ))}
        </div>
      </div>

      {/* Technical Stack Table */}
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <h2 className="text-xl font-bold text-white">Enterprise Technology Stack</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {architectureContent.technicalStack.map((tech) => (
            <div
              key={tech.category}
              className="p-4 rounded-xl border border-slate-800 bg-[#0b101f] space-y-1.5"
            >
              <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                {tech.category}
              </div>
              <div className="text-sm font-bold text-white">{tech.technology}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{tech.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <FadeIn className="text-center p-8 rounded-2xl bg-[#0b101f] border border-slate-800 space-y-4 max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-white">Explore the codebase and API guides</h3>
        <p className="text-xs text-slate-400">
          Read our in-depth developer guides to configure AI model providers, BullMQ queues, and
          pgvector indexes.
        </p>
        <div className="pt-2">
          <Link href="/docs">
            <Button size="md" variant="ai">
              View Developer Documentation →
            </Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
