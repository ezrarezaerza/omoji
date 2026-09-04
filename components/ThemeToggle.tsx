"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../src/context/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      id="theme-mode-toggle-btn"
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      aria-label={`Current theme: ${theme}. Click to switch to ${isDark ? "light" : "dark"} mode.`}
      className={`group relative flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-200 backdrop-blur-md active:scale-95 cursor-pointer select-none ${
        isDark
          ? "border-white/15 bg-[#182229] text-white hover:border-emerald-500/40 hover:bg-[#202c33]"
          : "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
      } ${className}`}
    >
      {/* Animated Icon Pill */}
      <div className="relative flex h-4 w-4 items-center justify-center">
        <motion.div
          key={theme}
          initial={{ rotate: -90, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500 group-hover:text-amber-600 transition-colors" />
          )}
        </motion.div>
      </div>

      {/* Mode Text & Visual Status Pill */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline font-bold">
          {isDark ? "Dark Mode" : "Light Mode"}
        </span>
        <span
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            isDark
              ? "bg-[#25D366] shadow-[0_0_8px_#25D366]"
              : "bg-emerald-600 shadow-[0_0_6px_rgba(5,150,105,0.4)]"
          }`}
        />
      </div>
    </button>
  );
}

export default ThemeToggle;
