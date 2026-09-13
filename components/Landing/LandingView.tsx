"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Smartphone,
  Layers,
  ShieldCheck,
  CheckCircle2,
  FolderArchive,
  ArrowUpRight,
  Palette,
} from "lucide-react";
import { LandingHero } from "./LandingHero";
import { InteractiveStickerPreviewer } from "./InteractiveStickerPreviewer";
import { WorkflowStepper } from "./WorkflowStepper";
import { LiveWhatsAppShowcase } from "./LiveWhatsAppShowcase";
import { SocialDiscoverySection } from "./SocialDiscoverySection";
import { LandingFooter } from "./LandingFooter";
import { StickerPackRecord } from "../../src/types/pack";

interface LandingViewProps {
  onStartPack: (packTitle: string) => void;
  onOpenCanvas: (imageUrl?: string) => void;
  onExploreCommunity: () => void;
  onRequestStudioTab: () => void;
  onClonePack: (studioPack: StickerPackRecord) => void;
  onRemixSticker: (imageUrl: string, title?: string) => void;
  totalProjects: number;
  totalStickers: number;
  activeUser: { id: string; email: string; username: string } | null;
}

export function LandingView({
  onStartPack,
  onOpenCanvas,
  onExploreCommunity,
  onRequestStudioTab,
  onClonePack,
  onRemixSticker,
  totalProjects,
  totalStickers,
  activeUser,
}: LandingViewProps) {
  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-6">
      {/* 1. Quick Returning User Resume Banner */}
      {totalProjects > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 dark:bg-emerald-950/40 px-5 py-3.5 backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/20 text-[#25D366] shrink-0">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div>
              <p className="font-['Space_Grotesk'] text-sm font-bold text-slate-900 dark:text-white">
                You have {totalProjects} active sticker pack{totalProjects > 1 ? "s" : ""} ({totalStickers} sticker{totalStickers > 1 ? "s" : ""})
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick up right where you left off in your Studio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRequestStudioTab}
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 font-['Space_Grotesk'] text-xs font-black text-slate-950 shadow-md hover:bg-[#20bd5a] active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span>Open My Packs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {/* 2. Hero Section with One-Tap Pack Kickstarter */}
      <LandingHero
        onStartPack={onStartPack}
        onOpenCanvas={() => onOpenCanvas()}
        onExploreCommunity={onExploreCommunity}
        defaultCreatorName={activeUser ? `@${activeUser.username}` : "Sticker Creator"}
      />

      {/* 3. Interactive Before / After Sticker Previewer (Phase 2) */}
      <section className="relative w-full">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#25D366] font-['Space_Grotesk']">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Real-Time Demo</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              See How Ordinary Photos Become WhatsApp Stickers
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Slide horizontally to compare raw photography with our instant AI subject isolation, crisp white border, and chat bubble styling.
          </p>
        </div>

        <InteractiveStickerPreviewer
          onTestInEditor={(imageUrl) => onOpenCanvas(imageUrl)}
        />
      </section>

      {/* 4. Phase 3: The 3-Step Creation Workflow (Linear / Stepper Layout, No Bento) */}
      <WorkflowStepper
        onStartPack={() => onStartPack("My WhatsApp Pack")}
        onOpenCanvas={() => onOpenCanvas()}
      />

      {/* 5. Phase 4: Live WhatsApp Experience Simulator */}
      <LiveWhatsAppShowcase
        onStartPack={() => onStartPack("My WhatsApp Pack")}
        onOpenCanvas={(url) => onOpenCanvas(url)}
      />

      {/* 6. Phase 4: Social Discovery & Trending Community Packs */}
      <SocialDiscoverySection
        onClonePack={onClonePack}
        onRemixSticker={onRemixSticker}
        onExploreCommunity={onExploreCommunity}
      />

      {/* 7. Phase 5: High-Impact Bottom Conversion Callout */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-900 via-[#111b21] to-[#075E54] p-8 sm:p-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="max-w-xl">
            <span className="rounded-full bg-white/10 px-3 py-1 font-['Space_Grotesk'] text-xs font-bold text-[#25D366]">
              Ready in under 60 seconds
            </span>
            <h3 className="mt-3 font-['Space_Grotesk'] text-2xl sm:text-3xl lg:text-4xl font-black">
              Start building your custom WhatsApp sticker pack now.
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              Create your pack, drop your photos, isolate subjects with AI, and transfer directly to WhatsApp on Android.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onRequestStudioTab}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 font-['Space_Grotesk'] text-sm font-black text-slate-950 shadow-xl hover:bg-[#20bd5a] active:scale-95 transition-all cursor-pointer"
            >
              <span>Launch Sticker Studio</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={onExploreCommunity}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 font-['Space_Grotesk'] text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer backdrop-blur-md"
            >
              <span>Explore Community</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Ambient emerald blur */}
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#25D366]/20 blur-[90px]" />
      </section>

      {/* 8. Phase 5: Technical Specifications & Navigation Footer */}
      <LandingFooter
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onNavigateStudio={onRequestStudioTab}
        onNavigateExplore={onExploreCommunity}
        onOpenCanvas={() => onOpenCanvas()}
      />
    </div>
  );
}
