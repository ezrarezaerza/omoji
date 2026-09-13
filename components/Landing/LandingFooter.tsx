"use client";

import React from "react";
import {
  Sticker,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Layers,
  Sparkles,
  Palette,
  HardDrive,
  ExternalLink,
} from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

interface LandingFooterProps {
  onNavigateHome: () => void;
  onNavigateStudio: () => void;
  onNavigateExplore: () => void;
  onOpenCanvas: () => void;
}

export function LandingFooter({
  onNavigateHome,
  onNavigateStudio,
  onNavigateExplore,
  onOpenCanvas,
}: LandingFooterProps) {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-white/10 pt-12 pb-16 mt-8">
      {/* 4-Column Linear Footer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
        {/* Col 1: Brand & Identity (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#25D366] via-[#128C7E] to-[#075E54] text-white shadow-md shadow-emerald-500/20">
              <Sticker className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-['Space_Grotesk'] text-lg font-black tracking-tight text-slate-900 dark:text-white">
                OMOJI
              </span>
              <span className="ml-1.5 font-['Space_Grotesk'] text-sm font-bold text-[#25D366]">
                Sticker Studio
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
            Create custom WhatsApp stickers from your favorite photos and memes with instant AI cutouts, custom text captions, and fast 1-tap exports.
          </p>

          <div className="flex items-center gap-2 pt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 font-['Space_Grotesk']">
            <ShieldCheck className="h-4 w-4 text-[#25D366]" />
            <span>100% Client-Side Privacy</span>
          </div>
        </div>

        {/* Col 2: WhatsApp Technical Specifications (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h4 className="font-['Space_Grotesk'] text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Quality Standards
          </h4>
          <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2 rounded-xl bg-slate-100 dark:bg-white/5 p-2.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#25D366] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-slate-900 dark:text-white text-[11px]">512×512 Canvas</strong>
                <span className="text-[10px] text-slate-500">Square WebP format</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-100 dark:bg-white/5 p-2.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#25D366] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-slate-900 dark:text-white text-[11px]">&lt;100 KB Size</strong>
                <span className="text-[10px] text-slate-500">Auto-compressed</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-100 dark:bg-white/5 p-2.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#25D366] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-slate-900 dark:text-white text-[11px]">Custom Packs</strong>
                <span className="text-[10px] text-slate-500">Up to 30 stickers per pack</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-100 dark:bg-white/5 p-2.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#25D366] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-slate-900 dark:text-white text-[11px]">Pack Cover Icon</strong>
                <span className="text-[10px] text-slate-500">WhatsApp sticker tray icon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Navigation Links (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <h4 className="font-['Space_Grotesk'] text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Quick Navigation
          </h4>
          <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400 font-['Space_Grotesk']">
            <li>
              <button
                type="button"
                onClick={onNavigateHome}
                className="hover:text-[#25D366] transition-colors cursor-pointer"
              >
                Home Overview
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onNavigateStudio}
                className="hover:text-[#25D366] transition-colors cursor-pointer"
              >
                Sticker Pack Studio
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onNavigateExplore}
                className="hover:text-[#25D366] transition-colors cursor-pointer"
              >
                Explore Community (12+ Packs)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onOpenCanvas}
                className="hover:text-[#25D366] transition-colors cursor-pointer"
              >
                Freeform Canvas Editor
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar: Copyright, PWA status, Theme Toggle */}
      <div className="pt-8 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-['Space_Grotesk']">
        <div className="flex items-center gap-2">
          <span>&copy; 2026 OMOJI Sticker Studio. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>WhatsApp Compatible</span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
