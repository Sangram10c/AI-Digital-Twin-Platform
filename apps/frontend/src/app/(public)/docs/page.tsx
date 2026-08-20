import Link from 'next/link';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { documentationContent } from '@/content/documentation';

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 space-y-16">
      {/* Header */}
      <FadeIn className="space-y-4 max-w-3xl">
        <Badge variant="ai" size="md">
          {documentationContent.header.badge}
        </Badge>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-5xl tracking-tight">
          {documentationContent.header.title}
          <span className="ai-gradient-text">{documentationContent.header.titleHighlight}</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {documentationContent.header.subtitle}
        </p>
      </FadeIn>

      {/* Quick Start Bar */}
      <FadeIn className="p-6 sm:p-8 rounded-2xl bg-[#0b101f] border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            ⚡ {documentationContent.quickStart.title}
          </h2>
          <Badge variant="ai" size="sm">
            Beginner Friendly
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documentationContent.quickStart.steps.map((st) => (
            <div
              key={st.step}
              className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-1.5"
            >
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">
                Step 0{st.step}
              </span>
              <h3 className="text-sm font-bold text-white">{st.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{st.detail}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Documentation Categories Grid */}
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-white">Documentation Categories</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentationContent.categories.map((cat) => (
            <MotionCard
              key={cat.id}
              spotlightColor="rgba(59, 130, 246, 0.12)"
              className="flex flex-col justify-between p-6 space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xl">
                    {cat.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white">{cat.title}</CardTitle>
                    <span className="text-[10px] font-mono text-slate-400">
                      {cat.articles.length} guides
                    </span>
                  </div>
                </div>

                <CardDescription className="text-xs text-slate-400 leading-relaxed">
                  {cat.description}
                </CardDescription>

                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  {cat.articles.map((art) => (
                    <div
                      key={art.slug}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 transition-colors text-xs text-slate-300"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-blue-400 text-xs">📄</span>
                        <span className="truncate">{art.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-400 font-mono">
                        {art.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {art.badge}
                          </span>
                        )}
                        <span>{art.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/40">
                <Link
                  href="/docs"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group-hover:translate-x-0.5"
                >
                  Browse all {cat.title} articles →
                </Link>
              </div>
            </MotionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
