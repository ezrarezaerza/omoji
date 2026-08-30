"use client";

import React, { useState } from "react";
import { Sparkles, Sticker, Zap, Download, UserCircle, X, ShieldCheck, Palette } from "lucide-react";
import { BentoGrid } from "../components/BentoGrid";
import { AuthForms } from "../components/AuthForms";
import { StickerWorkspace } from "../components/Editor/StickerWorkspace";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [activeUser, setActiveUser] = useState<{ id: string; email: string; username: string } | null>(null);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Top Brand Header Bar */}
      <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 text-zinc-950 shadow-lg shadow-orange-500/25">
            <Sticker className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">
                OMOJI <span className="text-orange-400 font-semibold text-base">Sticker Studio</span>
              </span>
              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                WhatsApp
              </span>
            </div>
            <p className="text-xs text-zinc-400">Make your own emoji & sticker packs</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-md">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Instant 1-Click Magic</span>
          </div>

          <button
            type="button"
            onClick={() => setShowEditor(!showEditor)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
              showEditor
                ? "bg-white text-zinc-950 shadow-lg shadow-white/10"
                : "border border-white/20 bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            <Palette className="h-4 w-4 text-orange-400" />
            {showEditor ? "Back to Dashboard" : "Open Sticker Maker"}
          </button>

          {activeUser ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>@{activeUser.username}</span>
            </div>
          ) : (
            <button
              id="auth-open-btn"
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/15 px-4 py-2 text-xs font-bold text-orange-300 backdrop-blur-md transition-all hover:bg-orange-500/25 active:scale-95"
            >
              <UserCircle className="h-4 w-4 text-orange-400" />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main View Router: Workspace Editor vs Dashboard */}
      <AnimatePresence mode="wait">
        {showEditor ? (
          <motion.div
            key="editor-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <StickerWorkspace onBack={() => setShowEditor(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Main Title Hero Section */}
            <section className="mb-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300 mb-4 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                Turn any photo into WhatsApp stickers in seconds
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl font-['Space_Grotesk'] leading-[1.08]">
                Make your own <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">Omoji</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-zinc-300/90 leading-relaxed font-['Plus_Jakarta_Sans']">
                Turn your favorite photos, pet pictures, and funny memes into ready-to-use WhatsApp stickers with automatic background cutout and bold custom captions.
              </p>
            </section>

            {/* Bento Grid Layout Engine */}
            <section aria-label="Omoji Sticker Studio Dashboard Bento Grid">
              <BentoGrid onOpenEditor={() => setShowEditor(true)} />
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg"
            >
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-zinc-300 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <AuthForms
                onSuccess={(user) => {
                  setActiveUser(user);
                  setShowAuthModal(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer info */}
      <footer className="mt-16 border-t border-white/10 pt-6 text-center text-xs text-zinc-500">
        <p>Omoji • Sticker Studio for WhatsApp • Easy photo cutouts, fun captions, and one-tap pack exports</p>
      </footer>
    </div>
  );
}
