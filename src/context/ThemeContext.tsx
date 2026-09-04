"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { triggerHaptic } from "../../utils/haptics";

export type ThemeMode = "dark" | "light";

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "omoji_theme_preference";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
        applyThemeClass(savedTheme);
      } else {
        // Fallback: check system preference
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: ThemeMode = prefersDark ? "dark" : "dark"; // Default to dark WhatsApp
        setThemeState(initialTheme);
        applyThemeClass(initialTheme);
      }
    } catch {
      applyThemeClass("dark");
    }
    setMounted(true);
  }, []);

  const applyThemeClass = (newTheme: ThemeMode) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const body = document.body;

    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      body.classList.add("dark");
      body.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      body.classList.add("light");
      body.classList.remove("dark");
    }

    // Update meta theme-color for browser address bar & PWA status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", newTheme === "dark" ? "#0b141a" : "#f0f2f5");
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyThemeClass(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn("Could not persist theme to localStorage", e);
    }
  };

  const toggleTheme = () => {
    triggerHaptic("selection");
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider
    return {
      theme: "dark",
      isDark: true,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}
