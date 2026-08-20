import Link from 'next/link';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { integrationsContent } from '@/content/integrations';

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 space-y-16">
      {/* Header */}
      <FadeIn className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {integrationsContent.header.badge}
        </Badge>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-5xl tracking-tight">
          {integrationsContent.header.title}
          <span className="ai-gradient-text">{integrationsContent.header.titleHighlight}</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {integrationsContent.header.subtitle}
        </p>
      </FadeIn>

      {/* Integration Categories */}
      <div className="space-y-12">
        {integrationsContent.categories.map((category) => (
          <div key={category.title} className="space-y-6">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-xl font-bold text-white">{category.title}</h2>
              <p className="text-xs text-slate-400">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.items.map((item) => (
                <MotionCard
                  key={item.name}
                  spotlightColor="rgba(59, 130, 246, 0.14)"
                  className="p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xl">
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 font-mono">
                        {item.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {item.category}
                      </span>
                      <CardTitle className="text-base font-bold text-white mt-0.5">
                        {item.name}
                      </CardTitle>
                    </div>

                    <CardDescription className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      {item.status}
                    </span>
                    <Link
                      href={item.href}
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium text-xs"
                    >
                      Documentation →
                    </Link>
                  </div>
                </MotionCard>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Callout */}
      <FadeIn className="text-center p-8 rounded-2xl bg-[#0b101f] border border-slate-800 space-y-3 max-w-3xl mx-auto">
        <h3 className="text-lg font-bold text-white">
          {integrationsContent.customIntegrationCallout.title}
        </h3>
        <p className="text-xs text-slate-400">
          {integrationsContent.customIntegrationCallout.description}
        </p>
        <div className="pt-1">
          <Link href="/docs">
            <Button size="sm" variant="outline" className="text-xs">
              {integrationsContent.customIntegrationCallout.cta}
            </Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
