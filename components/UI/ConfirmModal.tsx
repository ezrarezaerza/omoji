"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete Permanently",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isLoading) onClose();
          }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111b21] p-6 shadow-2xl z-10"
        >
          {/* Top Icon & Close */}
          <div className="flex items-start justify-between gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                variant === "danger"
                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}
            >
              {variant === "danger" ? (
                <Trash2 className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-4">
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk']">
              {title}
            </h3>
            <div className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-black text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-500 shadow-red-600/25"
                  : "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25"
              }`}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
