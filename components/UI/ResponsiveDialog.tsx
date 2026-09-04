"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface ResponsiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g., "max-w-md", "max-w-lg", "max-w-2xl", "max-w-4xl"
  showCloseButton?: boolean;
  className?: string;
}

export function ResponsiveDialog({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  maxWidthClass = "max-w-lg",
  showCloseButton = true,
  className = "",
}: ResponsiveDialogProps) {
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
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-40"
          />

          {/* Modal / Slide-in Drawer Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={`relative z-50 w-full ${maxWidthClass} max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-[32px] sm:rounded-3xl border-t sm:border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111b21] shadow-2xl ${className}`}
          >
            {/* Mobile Sheet Drag Indicator Bar with Native Touch Swipe-Down Dismiss */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) {
                  onClose();
                }
              }}
              className="flex sm:hidden w-full items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
              title="Swipe down to dismiss"
            >
              <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/20 transition-all active:scale-x-110 active:bg-slate-400 dark:active:bg-white/40" />
            </motion.div>

            {/* Optional Standard Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  {icon && <div className="shrink-0">{icon}</div>}
                  <div className="min-w-0">
                    {title && (
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk'] truncate">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
