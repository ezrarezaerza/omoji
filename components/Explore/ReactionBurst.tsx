"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ReactionParticle {
  id: string;
  emoji: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface ReactionBurstProps {
  children?: React.ReactNode;
  className?: string;
}

export interface ReactionBurstHandle {
  burst: (emoji?: string, originEvent?: React.MouseEvent) => void;
}

/**
 * Reaction Burst Component
 * Generates energetic floating particle explosions (hearts, laugh emojis, sparks)
 * for micro-interactions across the Explore catalog.
 */
export const ReactionBurst: React.FC<{
  particles: ReactionParticle[];
  onComplete: (id: string) => void;
}> = ({ particles, onComplete }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible z-50">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              opacity: 1,
              scale: 0.3,
              x: 0,
              y: 0,
              rotate: 0,
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0.3, p.scale, p.scale * 1.2],
              x: p.x,
              y: p.y,
              rotate: p.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1], // snappy ease out
            }}
            onAnimationComplete={() => onComplete(p.id)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl select-none"
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export function useReactionBurst() {
  const [particles, setParticles] = useState<ReactionParticle[]>([]);

  const triggerBurst = useCallback((emoji: string = "❤️", count: number = 6) => {
    const newParticles: ReactionParticle[] = Array.from({ length: count }, (_, i) => {
      // Randomized spray spread
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 40 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 30; // bias upward
      return {
        id: `burst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        emoji,
        x,
        y,
        rotation: (Math.random() - 0.5) * 60,
        scale: 0.9 + Math.random() * 0.4,
      };
    });

    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const removeParticle = useCallback((id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { particles, triggerBurst, removeParticle };
}
