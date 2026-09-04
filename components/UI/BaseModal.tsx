"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
  showCloseButton?: boolean;
  className?: string;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidthClass = "max-w-xl",
  showCloseButton = true,
  className = "",
}: BaseModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={`relative w-full ${maxWidthClass} overflow-hidden rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111b21] shadow-2xl z-10 flex flex-col max-h-[90vh] ${className}`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 px-5 sm:px-6 py-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#25D366] border border-emerald-500/20">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && (
                      <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk'] truncate">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shrink-0"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
