'use client';

import * as React from 'react';
import { motion, useMotionValue, useMotionTemplate, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface MotionCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  spotlightColor?: string;
  enableSpotlight?: boolean;
}

export function MotionCard({
  children,
  className,
  spotlightColor = 'rgba(59, 130, 246, 0.12)',
  enableSpotlight = true,
  ...props
}: MotionCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group relative rounded-2xl border border-slate-800/80 bg-[#0b101f] p-6 text-card-foreground shadow-sm transition-colors hover:border-blue-500/60 overflow-hidden',
        className,
      )}
      {...props}
    >
      {/* Motion.dev Interactive Spotlight Overlay */}
      {enableSpotlight && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background }}
        />
      )}

      {/* Card Content Layer */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
