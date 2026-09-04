"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  WifiOff,
  Wifi,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { triggerHaptic } from "../utils/haptics";
import { ResponsiveDialog } from "./UI/ResponsiveDialog";

export function PWAInstallBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already running in standalone PWA window
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice && !isStandaloneMode);

    // Capture Chrome/Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      triggerHaptic("success");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic("medium");

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      triggerHaptic("success");
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // If running in installed standalone app, only show offline notifications
  if (isStandalone) {
    return (
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-black px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md"
          >
            <WifiOff className="h-4 w-4" />
            <span>Offline Mode Active • All drafts & editing work 100% locally</span>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      {/* Offline Status Top Bar Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-black px-4 py-2 text-xs font-extrabold flex items-center justify-center gap-2 shadow-xl backdrop-blur-md"
          >
            <WifiOff className="h-4 w-4" />
            <span>Offline Mode Active • Your edits and sticker packs are autosaved locally in IndexedDB</span>
          </motion.div>
        )}
        {wasOffline && isOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 inset-x-0 z-50 bg-[#25D366] text-black px-4 py-2 text-xs font-extrabold flex items-center justify-center gap-2 shadow-xl backdrop-blur-md"
          >
            <Wifi className="h-4 w-4" />
            <span>Back Online • Synchronized</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom PWA Install Prompt Banner */}
      <AnimatePresence>
        {(isInstallable || isIOS) && !isBannerDismissed && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40"
          >
            <div className="relative flex items-center justify-between gap-3.5 rounded-2xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-[#111b21]/95 p-3.5 shadow-2xl backdrop-blur-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#25D366] via-emerald-500 to-[#128C7E] text-white font-black shadow-lg shadow-emerald-500/25">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Install Omoji App</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-300">
                      PWA
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    Fast offline sticker creation on your home screen
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#128C7E] px-3 py-2 text-xs font-bold text-white hover:brightness-105 active:scale-95 transition shadow-md shadow-emerald-500/25 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Install</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBannerDismissed(true)}
                  className="rounded-lg p-1.5 text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                  aria-label="Dismiss install banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS "Add to Home Screen" Instructions Modal */}
      <ResponsiveDialog
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        title="Install on iPhone / iPad"
        description="Add to Home Screen in 2 taps"
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-slate-900 font-bold">
            <Sparkles className="h-5 w-5" />
          </div>
        }
        maxWidthClass="max-w-sm"
      >
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 font-sans">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-200/80 dark:border-white/10">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              1
            </span>
            <p>
              Tap the <strong className="text-slate-900 dark:text-white">Share</strong> button <Share className="inline h-3.5 w-3.5 text-blue-500 mx-1" /> at the bottom of Safari.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-white/5 p-3 border border-slate-200/80 dark:border-white/10">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              2
            </span>
            <p>
              Scroll down and tap <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong> <PlusSquare className="inline h-3.5 w-3.5 text-slate-700 dark:text-zinc-200 mx-1" />.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowIOSModal(false)}
            className="mt-4 w-full rounded-2xl bg-[#25D366] py-3 text-xs font-black text-black hover:brightness-105 active:scale-95 transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </ResponsiveDialog>
    </>
  );
}
export default PWAInstallBanner;
