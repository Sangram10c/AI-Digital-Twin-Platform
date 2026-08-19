'use client';

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface AnimatedBackgroundProps {
  variant?: 'full' | 'subtle' | 'hero' | 'minimal';
  showOrbs?: boolean;
  className?: string;
}

export function AnimatedBackground({
  variant = 'full',
  showOrbs = true,
  className,
}: AnimatedBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#050811]',
        className,
      )}
    >
      {/* Subtle Ambient Aurora Glow without any square grids */}
      {showOrbs && variant !== 'minimal' && (
        <>
          {/* Top-Right Glowing Violet/Indigo Glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.35, 0.2],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-transparent blur-[140px]"
          />

          {/* Top-Left Glowing Cyan/Electric Blue Glow */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            className="absolute top-1/4 -left-48 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent blur-[130px]"
          />

          {/* Bottom Center Subtle Glow */}
          {variant === 'full' && (
            <motion.div
              animate={{
                scale: [0.95, 1.1, 0.95],
                opacity: [0.1, 0.25, 0.1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 2,
              }}
              className="absolute bottom-0 left-1/3 h-[500px] w-[600px] rounded-full bg-gradient-to-t from-indigo-900/15 via-purple-900/10 to-transparent blur-[150px]"
            />
          )}
        </>
      )}
    </div>
  );
}
