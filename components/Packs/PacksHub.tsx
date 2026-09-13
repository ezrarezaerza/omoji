"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusCircle,
  FolderArchive,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sticker,
  ArrowRight,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PackCard } from "./PackCard";
import { CreatePackModal } from "./CreatePackModal";
import { fetchPacks, deletePack } from "../../utils/packApi";
import { StickerPackRecord } from "../../src/types/pack";

interface PacksHubProps {
  onSelectPack: (pack: StickerPackRecord) => void;
  onExportPack?: (pack: StickerPackRecord) => void;
  onOpenEditor?: (url?: string, file?: File, draft?: any) => void;
  defaultCreatorName?: string;
  isGuest?: boolean;
  onOpenAuth?: () => void;
}

export function PacksHub({
  onSelectPack,
  onExportPack,
  onOpenEditor,
  defaultCreatorName = "Sticker Creator",
  isGuest = false,
  onOpenAuth,
}: PacksHubProps) {
  const [packs, setPacks] = useState<StickerPackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadAllPacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPacks();
      setPacks(data);
    } catch (err: any) {
      console.warn("Could not load packs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllPacks();
  }, [loadAllPacks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePackCreated = (newPack: StickerPackRecord) => {
    setPacks((prev) => [newPack, ...prev]);
    showToast(`Pack "${newPack.title}" created! Opening studio...`);
    onSelectPack(newPack);
  };

  const handleDeletePack = async (packId: string) => {
    try {
      await deletePack(packId);
      setPacks((prev) => prev.filter((p) => p.id !== packId));
      showToast("Sticker pack deleted successfully.");
    } catch (err: any) {
      showToast(err.message || "Failed to delete pack.");
    }
  };

  // Filter packs based on search query
  const filteredPacks = packs.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.publisher.toLowerCase().includes(q)
    );
  });

  // Calculate live statistics
  const totalPacks = packs.length;
  const totalStickersCount = packs.reduce(
    (sum, p) => sum + (p.stickers?.length || 0),
    0
  );
  const readyPacksCount = packs.filter(
    (p) => (p.stickers?.length || 0) >= 3
  ).length;

  return (
    <div className="w-full space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 dark:bg-[#111b21]/95 px-4 py-3 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Stats & Quick Actions Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Packs Card */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111b21] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>Total Packs</span>
            <FolderArchive className="h-4 w-4 text-[#25D366]" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
            {totalPacks}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Dedicated sets in PostgreSQL
          </p>
        </div>

        {/* Total Finalized Stickers Card */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111b21] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>Stickers in Sets</span>
            <Layers className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
            {totalStickersCount}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            512×512 WebP rendered assets
          </p>
        </div>

        {/* WhatsApp Export Ready Card */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111b21] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            <span>Ready for Export</span>
            <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
            {readyPacksCount}
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
            ≥ 3 stickers per pack required
          </p>
        </div>

        {/* Create Pack Trigger Card */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-[#25D366] via-emerald-600 to-[#128C7E] p-5 text-left text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:brightness-105 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              New Set
            </span>
            <PlusCircle className="h-5 w-5 text-white transition-transform group-hover:rotate-90" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black font-['Space_Grotesk']">
              ＋ Create Pack
            </div>
            <p className="mt-1 text-[11px] font-medium text-emerald-100">
              Opens a new sticker pack
            </p>
          </div>
        </button>
      </div>


      {/* Main Hub Section: Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk']">
              My Sticker Packs
            </h2>
            {isGuest && (
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Guest Mode
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {isGuest
              ? "Your packs and sticker slots are isolated to this guest session."
              : "Select any pack to view or edit stickers."}
          </p>
        </div>

        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by pack or creator..."
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] pl-10 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 transition-all shadow-xs"
            />
          </div>

          <button
            type="button"
            onClick={loadAllPacks}
            title="Refresh packs from PostgreSQL"
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#182229] transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-[#25D366]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Packs Grid or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12 text-center">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-3xl border border-slate-200/60 dark:border-white/5 bg-slate-100 dark:bg-[#111b21]/60"
            />
          ))}
        </div>
      ) : filteredPacks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPacks.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              onSelectPack={onSelectPack}
              onDeletePack={handleDeletePack}
              onExportPack={onExportPack}
            />
          ))}

          {/* Dotted "Add Another Pack" Bento Tile */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="group flex flex-col items-center justify-center min-h-[260px] rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-[#111b21]/30 p-8 text-center transition-all hover:border-[#25D366] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 active:scale-[0.99] cursor-pointer"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#182229] text-slate-400 group-hover:text-[#25D366] group-hover:scale-110 shadow-sm transition-all mb-3">
              <PlusCircle className="h-7 w-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white font-['Space_Grotesk']">
              Create New Pack
            </h4>
            <p className="mt-1 text-xs font-medium text-slate-400 max-w-[200px]">
              Start another pack with custom title and creator branding.
            </p>
          </button>
        </div>
      ) : searchQuery ? (
        /* No Search Matches */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mb-4">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white font-['Space_Grotesk']">
            No packs found matching "{searchQuery}"
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Try checking for typos or clear your search term.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* Empty State: First Time Creator */
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#111b21] p-8 sm:p-12 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#25D366]/20 via-emerald-500/20 to-[#128C7E]/20 text-[#25D366] mb-6 shadow-inner">
            <Sticker className="h-10 w-10 stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#25D366]" />
            <span>Option 1: Pack Dashboard Architecture</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
            No Sticker Packs Yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed font-['Plus_Jakarta_Sans']">
            Every sticker belongs to a pack! Define your pack name and creator name to unlock 30 open slots for AI cutouts, meme text, and die-cut outlines.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-emerald-500/25 transition-all hover:brightness-105 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Your First Sticker Pack</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            {onOpenEditor && (
              <button
                type="button"
                onClick={() => onOpenEditor()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-white shadow-xs hover:border-[#25D366] transition-all cursor-pointer font-['Space_Grotesk']"
              >
                <span>Freeform Canvas</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Pack Modal */}
      <CreatePackModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPackCreated={handlePackCreated}
        defaultCreatorName={defaultCreatorName}
      />
    </div>
  );
}
