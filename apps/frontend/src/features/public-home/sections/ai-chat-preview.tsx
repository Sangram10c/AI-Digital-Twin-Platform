'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion/fade-in';
import { CitationPreview, type CitationItem } from '../components/citation-preview';
import { homeContent } from '@/content/home';

export function AiChatPreviewSection() {
  const [selectedCitationId, setSelectedCitationId] = React.useState<string>('cit-1');
  const { chatPreview } = homeContent;

  const citations: CitationItem[] = [
    {
      id: 'cit-1',
      sourceType: 'FILE',
      title: 'auth.service.ts',
      reference: 'apps/backend/src/modules/auth/auth.service.ts:L45-L89',
      excerpt:
        'async login(dto: LoginDto): Promise<AuthTokens> { const user = await this.validateUser(dto); return this.generateTokens(user); }',
      score: 0.96,
    },
    {
      id: 'cit-2',
      sourceType: 'FILE',
      title: 'jwt.strategy.ts',
      reference: 'apps/backend/src/modules/auth/strategies/jwt.strategy.ts:L20-L44',
      excerpt:
        'async validate(payload: JwtPayload): Promise<AuthUser> { return this.authService.validatePayload(payload); }',
      score: 0.91,
    },
    {
      id: 'cit-3',
      sourceType: 'PULL_REQUEST',
      title: 'PR #14',
      reference: 'Pull Request #14: feat(auth): implement rotating JWT and Redis blacklist',
      excerpt:
        'Introduced 15m access tokens with 7d refresh token rotation and atomic Redis session invalidation.',
      score: 0.88,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 w-full space-y-12" id="chat-citations">
      {/* Section Header */}
      <FadeIn className="text-center space-y-3 max-w-3xl mx-auto">
        <Badge variant="ai" size="md">
          {chatPreview.badge}
        </Badge>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {chatPreview.title}
          <span className="ai-gradient-text">{chatPreview.titleHighlight}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {chatPreview.subtitle}
        </p>
      </FadeIn>

      {/* Realistic Chat & Source Panel Container */}
      <FadeIn>
        <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl overflow-hidden rounded-2xl">
          {/* Top App Bar Preview */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-5 py-3 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="font-semibold text-white">AI Engineering Assistant</span>
              <span className="text-slate-400 hidden sm:inline">• session: main-repo-twin</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="ai" size="sm">
                Project Knowledge Active
              </Badge>
              <Badge
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex border-slate-700 text-slate-300"
              >
                3 Verified Sources
              </Badge>
            </div>
          </div>

          {/* Chat UI Split: Left Chat Stream, Right Source Citations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            {/* Left Column: Chat Conversation (7 cols) */}
            <div className="lg:col-span-7 p-5 sm:p-6 space-y-6">
              {/* User Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-200 font-bold text-xs">
                  U
                </div>
                <div className="space-y-1 max-w-xl">
                  <div className="text-[11px] font-medium text-slate-400">Team Member</div>
                  <div className="rounded-2xl rounded-tl-xs bg-slate-900 border border-slate-800 p-4 text-xs text-slate-200 leading-relaxed">
                    {chatPreview.question}
                  </div>
                </div>
              </motion.div>

              {/* AI Response with Grounded Citations */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-500/30">
                  DT
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-purple-400">AI Digital Twin</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Verified Answer • 342ms
                    </span>
                  </div>

                  <div className="rounded-2xl rounded-tl-xs border border-slate-800 bg-slate-900/90 p-4 text-xs text-slate-200 space-y-3 leading-relaxed">
                    <p>
                      User login is handled through <strong>secure token rotation</strong> with
                      short-lived session tokens (15m) and protected refresh tokens (7d){' '}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCitationId('cit-1')}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          selectedCitationId === 'cit-1'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        }`}
                      >
                        [1] auth.service.ts
                      </motion.button>
                      .
                    </p>

                    <p>
                      Protected routes validate tokens automatically before processing requests{' '}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCitationId('cit-2')}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          selectedCitationId === 'cit-2'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        }`}
                      >
                        [2] jwt.strategy.ts
                      </motion.button>
                      .
                    </p>

                    <p>
                      When a user logs out, active session tokens are immediately invalidated across
                      all devices, merged in Pull Request #14{' '}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCitationId('cit-3')}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          selectedCitationId === 'cit-3'
                            ? 'bg-purple-500 text-white shadow-sm'
                            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        }`}
                      >
                        [3] PR #14
                      </motion.button>
                      .
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Source Citations & Provenance Inspector (5 cols) */}
            <div className="lg:col-span-5 p-5 sm:p-6 space-y-4 bg-slate-950/40">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  📑 {chatPreview.sourcesTitle}
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="text-[10px] border-slate-700 text-slate-300"
                >
                  Verified Matches
                </Badge>
              </div>

              <div className="space-y-2.5">
                <AnimatePresence mode="wait">
                  {citations.map((c) => (
                    <motion.div
                      key={c.id}
                      whileHover={{ x: 3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <CitationPreview
                        citation={c}
                        isSelected={selectedCitationId === c.id}
                        onClick={() => setSelectedCitationId(c.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                <span>{chatPreview.sourcesCaption}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-blue-400 hover:text-blue-300"
                >
                  Explore Knowledge →
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>
    </section>
  );
}
