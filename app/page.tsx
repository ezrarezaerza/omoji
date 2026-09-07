"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Sticker,
  UserCircle,
  X,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  UploadCloud,
  LogOut,
  CheckCircle2,
  HardDrive,
  FolderArchive,
  Layers,
  Play,
  RotateCw,
} from "lucide-react";
import { AuthForms } from "../components/AuthForms";
import { StickerWorkspace } from "../components/Editor/StickerWorkspace";
import { PacksHub } from "../components/Packs/PacksHub";
import { PackDetailStudio } from "../components/Packs/PackDetailStudio";
import { ExploreFeed } from "../components/Explore/ExploreFeed";
import { ThemeToggle } from "../components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllDraftsFromDb,
  getDraftsStorageUsage,
  deleteSlotDraft,
  getSlotDraft,
  StickerDraft,
} from "../utils/draftsDb";
import { StickerPackRecord } from "../src/types/pack";
import { saveStickerToSlot, fetchPackDetails } from "../utils/packApi";
import { createWaStickersArchive } from "../utils/createWaStickers";
import { WhatsAppHandoffModal } from "../components/Packs/WhatsAppHandoffModal";

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [currentTab, setCurrentTab] = useState<"studio" | "explore">("studio");
  const [selectedPack, setSelectedPack] = useState<StickerPackRecord | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [handoffPack, setHandoffPack] = useState<StickerPackRecord | null>(null);
  const [activeUser, setActiveUser] = useState<{ id: string; email: string; username: string } | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);
  const [initialAnimatedFile, setInitialAnimatedFile] = useState<File | null>(null);
  const [initialDraft, setInitialDraft] = useState<StickerDraft | null>(null);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [isExportingPack, setIsExportingPack] = useState(false);

  // Synchronize active studio navigation state to sessionStorage for resilient context preservation
  const persistStudioState = useCallback((pack: StickerPackRecord | null, slotIndex: number | null, editorOpen: boolean) => {
    if (typeof window === "undefined") return;
    try {
      if (pack) {
        sessionStorage.setItem("omoji_active_pack_id", pack.id);
      } else {
        sessionStorage.removeItem("omoji_active_pack_id");
      }
      if (slotIndex !== null) {
        sessionStorage.setItem("omoji_active_slot_index", String(slotIndex));
      } else {
        sessionStorage.removeItem("omoji_active_slot_index");
      }
      sessionStorage.setItem("omoji_show_editor", editorOpen ? "true" : "false");
    } catch (e) {
      console.warn("Could not persist studio session state:", e);
    }
  }, []);

  // Live Creator Studio Metrics
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalStickers, setTotalStickers] = useState(0);
  const [storageUsage, setStorageUsage] = useState("0 KB");
  const [latestDraft, setLatestDraft] = useState<StickerDraft | null>(null);

  const refreshStudioMetrics = useCallback(async () => {
    try {
      const drafts = await getAllDraftsFromDb();
      setTotalProjects(drafts.length);
      const stickersCount = drafts.reduce((acc, d) => {
        return acc + (d.itemCount || (d.packStickers?.length || 0) + 1);
      }, 0);
      setTotalStickers(stickersCount);
      setLatestDraft(drafts.length > 0 ? drafts[0] : null);

      const usage = await getDraftsStorageUsage();
      setStorageUsage(usage.formattedSize);
    } catch (e) {
      console.warn("Could not calculate studio metrics:", e);
    }
  }, []);

  useEffect(() => {
    refreshStudioMetrics();
  }, [refreshStudioMetrics]);

  // Restore authenticated session & persisted studio navigation state on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("omoji_user_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.id) {
          setActiveUser(parsed);
          // Verify with database
          fetch("/api/auth/me", {
            headers: {
              "x-user-id": parsed.id,
              Authorization: `Bearer ${parsed.id}`,
            },
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.user) {
                setActiveUser(data.user);
                localStorage.setItem("omoji_user_session", JSON.stringify(data.user));
              }
            })
            .catch(() => {});
        }
      }

      // Restore active tab
      const savedTab = sessionStorage.getItem("omoji_nav_tab");
      if (savedTab === "explore" || savedTab === "studio") {
        setCurrentTab(savedTab as "studio" | "explore");
      }

      // Restore active pack and slot from sessionStorage if available
      const savedPackId = sessionStorage.getItem("omoji_active_pack_id");
      const savedSlotIndexStr = sessionStorage.getItem("omoji_active_slot_index");
      const savedShowEditor = sessionStorage.getItem("omoji_show_editor") === "true";

      if (savedPackId) {
        fetchPackDetails(savedPackId)
          .then(async (pack) => {
            if (pack) {
              setSelectedPack(pack);
              const slotIdx = savedSlotIndexStr !== null ? parseInt(savedSlotIndexStr, 10) : null;
              if (slotIdx !== null && !isNaN(slotIdx)) {
                setSelectedSlotIndex(slotIdx);
                if (savedShowEditor) {
                  const existingDraft = await getSlotDraft(pack.id, slotIdx);
                  const existingSticker = pack.stickers?.find((s) => s.slotIndex === slotIdx);
                  setInitialDraft(existingDraft || null);
                  setInitialImageUrl(existingSticker?.imageUrl || existingDraft?.activeImageUrl || null);
                  setShowEditor(true);
                }
              }
            }
          })
          .catch((err) => {
            console.warn("Could not restore active pack session:", err);
            sessionStorage.removeItem("omoji_active_pack_id");
            sessionStorage.removeItem("omoji_active_slot_index");
            sessionStorage.removeItem("omoji_show_editor");
          });
      }
    } catch (e) {
      console.warn("Could not restore session:", e);
    }
  }, []);

  // Listen for mobile QR handoff or external deep links (e.g., ?action=add-to-whatsapp&packId=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get("action");
      const packId = urlParams.get("packId");

      if (packId) {
        fetchPackDetails(packId).then((pack) => {
          if (pack) {
            setSelectedPack(pack);
            if (action === "add-to-whatsapp") {
              setHandoffPack(pack);
              setCurrentTab("studio");
            }
          }
        });
      }
    } catch (e) {
      console.warn("Error parsing URL parameters:", e);
    }
  }, []);

  const handleSignOut = () => {
    try {
      localStorage.removeItem("omoji_user_session");
      localStorage.removeItem("omoji_user_token");
    } catch (e) {}
    setActiveUser(null);
    setAuthNotice("Signed out successfully.");
    setTimeout(() => setAuthNotice(null), 3000);
  };

  const handleOpenEditor = (url?: string, file?: File, draft?: any) => {
    if (draft) {
      setInitialDraft(draft);
      setInitialImageUrl(null);
      setInitialAnimatedFile(null);
    } else {
      setInitialDraft(null);
      if (url) {
        setInitialImageUrl(url);
      } else {
        setInitialImageUrl(null);
      }

      if (file) {
        const isAnimated = file.type === "image/gif" || file.type === "video/mp4";
        if (isAnimated) {
          setInitialAnimatedFile(file);
        } else {
          setInitialAnimatedFile(null);
        }
      } else {
        setInitialAnimatedFile(null);
      }
    }

    setShowEditor(true);
    persistStudioState(selectedPack, selectedSlotIndex, true);
  };

  const handleSelectPack = (pack: StickerPackRecord) => {
    setSelectedPack(pack);
    setSelectedSlotIndex(null);
    persistStudioState(pack, null, false);
    setAuthNotice(`Opened "${pack.title}" in 30-Slot Studio (${pack.stickers?.length || 0}/30 filled)`);
    setTimeout(() => setAuthNotice(null), 3500);
  };

  const handleOpenEditorForSlot = (
    pack: StickerPackRecord,
    slotIndex: number,
    draftToResume?: StickerDraft | null,
    existingStickerUrl?: string | null
  ) => {
    setSelectedPack(pack);
    setSelectedSlotIndex(slotIndex);
    setInitialDraft(draftToResume || null);
    setInitialImageUrl(draftToResume?.activeImageUrl || existingStickerUrl || null);
    setInitialAnimatedFile(null);
    setShowEditor(true);
    persistStudioState(pack, slotIndex, true);
  };

  const handleCommitSlotFromEditor = async (
    slotIndex: number,
    dataUrl: string,
    emojis: string[] = ["✨"],
    isAnimated = false
  ) => {
    if (!selectedPack) return;
    try {
      const response = await saveStickerToSlot(selectedPack.id, slotIndex, {
        imageUrl: dataUrl,
        emojis,
        isAnimated,
      });

      setSelectedPack(response.pack);
      setShowEditor(false);
      setSelectedSlotIndex(null);
      persistStudioState(response.pack, null, false);
      setAuthNotice(`✨ Saved sticker to Slot #${slotIndex + 1}!`);
      setTimeout(() => setAuthNotice(null), 3500);
    } catch (err: any) {
      console.error("Failed to commit slot:", err);
      setAuthNotice(err.message || "Failed to save sticker to slot.");
      setTimeout(() => setAuthNotice(null), 4000);
    }
  };

  const handleNavigateSlotFromEditor = async (nextSlotIndex: number) => {
    if (!selectedPack) return;
    if (nextSlotIndex < 0 || nextSlotIndex > 29) return;

    try {
      const existingDraft = await getSlotDraft(selectedPack.id, nextSlotIndex);
      const existingSticker = selectedPack.stickers?.find(
        (s) => s.slotIndex === nextSlotIndex
      );

      setSelectedSlotIndex(nextSlotIndex);
      setInitialDraft(existingDraft || null);
      setInitialImageUrl(
        existingDraft?.activeImageUrl || existingSticker?.imageUrl || null
      );
      setInitialAnimatedFile(null);
      persistStudioState(selectedPack, nextSlotIndex, true);
    } catch (err) {
      console.warn("Failed to switch slot in editor:", err);
    }
  };

  const handleCommitAndAdvanceFromEditor = async (
    slotIndex: number,
    dataUrl: string,
    emojis: string[] = ["✨"],
    isAnimated = false
  ) => {
    if (!selectedPack) return;
    try {
      const response = await saveStickerToSlot(selectedPack.id, slotIndex, {
        imageUrl: dataUrl,
        emojis,
        isAnimated,
      });

      setSelectedPack(response.pack);

      if (slotIndex < 29) {
        const nextSlot = slotIndex + 1;
        const nextDraft = await getSlotDraft(response.pack.id, nextSlot);
        const nextSticker = response.pack.stickers?.find(
          (s) => s.slotIndex === nextSlot
        );

        setSelectedSlotIndex(nextSlot);
        setInitialDraft(nextDraft || null);
        setInitialImageUrl(
          nextDraft?.activeImageUrl || nextSticker?.imageUrl || null
        );
        setInitialAnimatedFile(null);
        persistStudioState(response.pack, nextSlot, true);
        setAuthNotice(`✨ Saved Slot #${slotIndex + 1}! Now editing Slot #${nextSlot + 1}`);
        setTimeout(() => setAuthNotice(null), 3500);
      } else {
        setShowEditor(false);
        setSelectedSlotIndex(null);
        persistStudioState(response.pack, null, false);
        setAuthNotice(`🎉 All 30 slots completed! Ready to export.`);
        setTimeout(() => setAuthNotice(null), 4000);
      }
    } catch (err: any) {
      console.error("Failed to commit and advance:", err);
      setAuthNotice(err.message || "Failed to save sticker.");
      setTimeout(() => setAuthNotice(null), 4000);
    }
  };

  const handlePackUpdated = useCallback((updated: StickerPackRecord) => {
    setSelectedPack(updated);
    persistStudioState(updated, null, false);
  }, [persistStudioState]);

  const handlePackDeleted = useCallback(() => {
    setSelectedPack(null);
    setSelectedSlotIndex(null);
    persistStudioState(null, null, false);
  }, [persistStudioState]);

  const handleExportPack = async (pack: StickerPackRecord) => {
    setHandoffPack(pack);
  };

  const handleTabChange = (tab: "studio" | "explore") => {
    setCurrentTab(tab);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("omoji_nav_tab", tab);
    }
  };

  const handleClonePackToStudio = useCallback((studioPack: StickerPackRecord) => {
    setSelectedPack(studioPack);
    setSelectedSlotIndex(null);
    setCurrentTab("studio");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("omoji_nav_tab", "studio");
    }
    persistStudioState(studioPack, null, false);
    refreshStudioMetrics();
  }, [persistStudioState, refreshStudioMetrics]);

  const handleRemixStickerInStudio = useCallback((url: string, title?: string) => {
    setInitialImageUrl(url);
    setInitialAnimatedFile(null);
    setInitialDraft(null);
    setShowEditor(true);
    persistStudioState(selectedPack, selectedSlotIndex, true);
    setAuthNotice(`🎨 Loaded "${title || "Sticker"}" into Canvas Editor for remixing!`);
    setTimeout(() => setAuthNotice(null), 3000);
  }, [selectedPack, selectedSlotIndex, persistStudioState]);

  const handleOpenStudioPack = useCallback((pack: StickerPackRecord, slotIdx?: number) => {
    setSelectedPack(pack);
    setSelectedSlotIndex(slotIdx !== undefined ? slotIdx : null);
    setCurrentTab("studio");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("omoji_nav_tab", "studio");
    }
    persistStudioState(pack, slotIdx !== undefined ? slotIdx : null, false);
    refreshStudioMetrics();
  }, [persistStudioState, refreshStudioMetrics]);

  // Global window paste handler: allows instant Ctrl+V from anywhere on the landing page
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (showEditor || showAuthModal) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            const previewUrl = URL.createObjectURL(file);
            handleOpenEditor(previewUrl, file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [showEditor, showAuthModal]);

  // Global drag-over overlay indicator
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsWindowDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsWindowDragging(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsWindowDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/") || file.type === "video/mp4") {
          const previewUrl = URL.createObjectURL(file);
          handleOpenEditor(previewUrl, file);
        }
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Top Brand Header Bar */}
      <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#25D366] via-[#128C7E] to-[#075E54] text-white shadow-lg shadow-emerald-500/25 shrink-0">
            <Sticker className="h-7 w-7 text-white stroke-[2.2]" />
          </div>
          <div>
            <h1 className="flex items-baseline gap-2 font-['Space_Grotesk'] leading-none">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                OMOJI
              </span>
              <span className="text-base sm:text-lg font-bold text-[#25D366]">
                Sticker Studio
              </span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              30-Slot WhatsApp & Telegram Pack Creator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Theme Switcher */}
          <ThemeToggle />

          {activeUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-[#25D366]" />
                <span className="font-semibold">@{activeUser.username}</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out of account"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              id="auth-open-btn"
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] px-4 py-2 text-xs font-bold text-slate-800 dark:text-white shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-[#202c33] active:scale-95 cursor-pointer"
            >
              <UserCircle className="h-4 w-4 text-[#25D366]" />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* App Header / Shell Navigation Bar */}
      {!showEditor && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111b21] p-1.5 shadow-sm">
            <button
              id="tab-studio-btn"
              type="button"
              onClick={() => handleTabChange("studio")}
              className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer font-['Space_Grotesk'] ${
                currentTab === "studio"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.01]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>My Pack Studio</span>
              {totalProjects > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    currentTab === "studio"
                      ? "bg-white/20 dark:bg-black/20 text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {totalProjects}
                </span>
              )}
            </button>

            <button
              id="tab-explore-btn"
              type="button"
              onClick={() => handleTabChange("explore")}
              className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer font-['Space_Grotesk'] ${
                currentTab === "explore"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.01]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#25D366]" />
              <span>Explore Community</span>
              <span className="rounded-full bg-[#25D366]/20 border border-[#25D366]/30 px-1.5 py-0.2 text-[10px] font-extrabold text-[#25D366]">
                12+
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>PWA Offline-Ready &amp; IndexedDB Synced</span>
          </div>
        </div>
      )}

      {/* Floating Status Notification Toast */}
      <AnimatePresence>
        {authNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 dark:bg-[#111b21]/95 px-4 py-3 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0" />
            <span>{authNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View Router: Workspace Editor vs Creator Studio vs Explore Feed */}
      <AnimatePresence mode="wait">
        {showEditor ? (
          <motion.div
            key="editor-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <StickerWorkspace
              onBack={() => {
                setShowEditor(false);
                setSelectedSlotIndex(null);
                persistStudioState(selectedPack, null, false);
              }}
              initialImageUrl={initialImageUrl}
              initialAnimatedFile={initialAnimatedFile}
              initialDraft={initialDraft}
              activeSlotInfo={
                selectedPack && selectedSlotIndex !== null
                  ? { pack: selectedPack, slotIndex: selectedSlotIndex }
                  : null
              }
              onCommitSlot={handleCommitSlotFromEditor}
              onNavigateSlot={handleNavigateSlotFromEditor}
              onCommitAndAdvance={handleCommitAndAdvanceFromEditor}
            />
          </motion.div>
        ) : currentTab === "explore" ? (
          <motion.div
            key="explore-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <ExploreFeed
              onClonePackToStudio={handleClonePackToStudio}
              onExportPack={handleExportPack}
              onRemixInStudio={handleRemixStickerInStudio}
              onOpenStudioPack={handleOpenStudioPack}
              onShowNotice={(msg) => {
                setAuthNotice(msg);
                setTimeout(() => setAuthNotice(null), 3500);
              }}
              onRequestStudioTab={() => handleTabChange("studio")}
            />
          </motion.div>
        ) : (
          /* UNIFIED CREATOR STUDIO (30-SLOT PACKS HUB & PACK DETAIL STUDIO) */
          <motion.div
            key={selectedPack ? `pack-detail-${selectedPack.id}` : "creator-studio-view"}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {selectedPack ? (
              <PackDetailStudio
                initialPack={selectedPack}
                onBack={() => {
                  setSelectedPack(null);
                  setSelectedSlotIndex(null);
                  persistStudioState(null, null, false);
                }}
                onOpenEditorForSlot={handleOpenEditorForSlot}
                onPackUpdated={handlePackUpdated}
                onPackDeleted={handlePackDeleted}
                onNavigateToExplore={() => handleTabChange("explore")}
              />
            ) : (
              <PacksHub
                onSelectPack={handleSelectPack}
                onExportPack={handleExportPack}
                onOpenEditor={handleOpenEditor}
                defaultCreatorName={activeUser ? `@${activeUser.username}` : "Sticker Creator"}
                isGuest={!activeUser}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Drag-Over Fullscreen Overlay */}
      <AnimatePresence>
        {isWindowDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-6 pointer-events-none"
          >
            <div className="flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-[#25D366] bg-[#111b21]/95 p-12 text-center shadow-2xl max-w-md w-full">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/20 text-[#25D366] mb-4">
                <UploadCloud className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-white font-['Space_Grotesk']">
                Drop your image here!
              </h3>
              <p className="mt-2 text-xs font-medium text-slate-300">
                Release anywhere to open in Omoji Sticker Studio with AI background cutout.
              </p>
            </div>
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
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-slate-700 dark:bg-white/10 dark:text-zinc-300 transition hover:bg-black/20 dark:hover:bg-white/20 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <AuthForms
                onSuccess={(user) => {
                  setActiveUser(user);
                  setShowAuthModal(false);
                  setAuthNotice(`Signed in as @${user.username}`);
                  setTimeout(() => setAuthNotice(null), 4000);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Add to WhatsApp Handoff Modal */}
      {handoffPack && (
        <WhatsAppHandoffModal
          isOpen={Boolean(handoffPack)}
          onClose={() => setHandoffPack(null)}
          pack={handoffPack}
          onNavigateToSlot={(slotIndex) => {
            setSelectedPack(handoffPack);
            handleOpenEditorForSlot(handoffPack, slotIndex);
            setHandoffPack(null);
          }}
        />
      )}

      {/* Footer info */}
      <footer className="mt-16 border-t border-slate-200/80 dark:border-white/10 pt-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
        <p>Omoji • Sticker Studio for WhatsApp • Easy photo cutouts, fun captions, and one-tap pack exports</p>
      </footer>
    </div>
  );
}

