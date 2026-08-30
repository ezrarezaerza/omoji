"use client";

import React, { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { LucideIcon } from "lucide-react";

export interface BentoCardProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  onClick?: () => void;
}

export function BentoCard({
  children,
  className = "",
  title,
  subtitle,
  icon: Icon,
  badge,
  onClick,
}: BentoCardProps) {
  return (
    <motion.div
      id={title ? `bento-card-${title.toLowerCase().replace(/\s+/g, "-")}` : undefined}
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        y: -3,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(249, 115, 22, 0.2)",
      }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 25,
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-white/15 bg-white/[0.08] p-6 sm:p-7 backdrop-blur-2xl transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.12] ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* Subtle Inner Highlight Gradient */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-600/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60" />

      {/* Card Header (if title or icon provided) */}
      {(title || Icon || badge) && (
        <div className="relative z-10 mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {Icon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-orange-400 shadow-inner transition-colors duration-300 group-hover:border-orange-400/40 group-hover:bg-orange-500/20 group-hover:text-orange-300">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-xl font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-orange-200">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs font-medium text-zinc-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {badge && (
            <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-orange-300 shadow-sm backdrop-blur-md">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className="relative z-10 flex-1">{children}</div>
    </motion.div>
  );
}

export default BentoCard;
