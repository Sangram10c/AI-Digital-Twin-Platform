import Link from 'next/link';
import { CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionCard } from '@/components/motion/motion-card';
import { FadeIn } from '@/components/motion/fade-in';
import { pricingContent } from '@/content/pricing';

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 space-y-16">
      {/* Header */}
      <FadeIn className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="ai" size="md">
          {pricingContent.header.badge}
        </Badge>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-5xl tracking-tight">
          {pricingContent.header.title}
          <span className="ai-gradient-text">{pricingContent.header.titleHighlight}</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {pricingContent.header.subtitle}
        </p>
      </FadeIn>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingContent.tiers.map((tier) => (
          <MotionCard
            key={tier.id}
            spotlightColor={
              tier.highlighted ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.12)'
            }
            className={`p-6 flex flex-col justify-between relative ${
              tier.highlighted
                ? 'border-purple-500/50 bg-[#0c1224] shadow-2xl glow-ai'
                : 'bg-[#0b101f]'
            }`}
          >
            {tier.highlighted && tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="ai" size="sm">
                  {tier.badge}
                </Badge>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <CardTitle className="text-lg font-bold text-white">{tier.name}</CardTitle>
                <CardDescription className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {tier.description}
                </CardDescription>
              </div>

              <div className="flex items-baseline gap-1 py-1">
                <span className="text-3xl font-extrabold text-white font-mono">{tier.price}</span>
                <span className="text-xs text-slate-400 font-mono">/{tier.billingPeriod}</span>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-2.5">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  What&apos;s Included:
                </span>
                <ul className="space-y-2">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-emerald-400 font-bold text-xs">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <CardFooter className="p-0 pt-6">
              <Link href={tier.href} className="w-full">
                <Button variant={tier.ctaVariant} className="w-full" size="md">
                  {tier.cta}
                </Button>
              </Link>
            </CardFooter>
          </MotionCard>
        ))}
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-8 max-w-4xl mx-auto pt-8">
        <FadeIn className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to know about plans and privacy.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pricingContent.faq.map((item, idx) => (
            <MotionCard key={idx} className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-white">{item.question}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.answer}</p>
            </MotionCard>
          ))}
        </div>
      </div>

      {/* Custom Needs Callout */}
      <FadeIn className="text-center p-8 rounded-2xl bg-[#0b101f] border border-slate-800 space-y-3 max-w-3xl mx-auto">
        <h3 className="text-lg font-bold text-white">{pricingContent.customNeedsCallout.title}</h3>
        <p className="text-xs text-slate-400">{pricingContent.customNeedsCallout.description}</p>
        <div className="pt-1">
          <Link href={pricingContent.customNeedsCallout.actionHref}>
            <Button size="sm" variant="outline" className="text-xs">
              {pricingContent.customNeedsCallout.actionText}
            </Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
