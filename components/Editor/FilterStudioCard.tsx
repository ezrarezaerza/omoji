"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Sliders,
  RotateCcw,
  Zap,
  Grid,
  Sun,
  Contrast,
  Palette,
  Check,
  Flame,
} from "lucide-react";
import {
  StickerFilterConfig,
  DEFAULT_FILTER_CONFIG,
  FILTER_PRESETS,
  FilterPreset,
  ComicEffectType,
} from "../../utils/filterEffects";

export interface FilterStudioCardProps {
  filterConfig: StickerFilterConfig;
  onChangeFilterConfig: (config: StickerFilterConfig) => void;
  disabled?: boolean;
}

const COMIC_EFFECT_OPTIONS: { id: ComicEffectType; label: string; icon: string }[] = [
  { id: "none", label: "None", icon: "🚫" },
  { id: "speed-lines", label: "Speed Lines", icon: "⚡" },
  { id: "starburst", label: "Starburst", icon: "💥" },
  { id: "comic-dots", label: "Pop Dots", icon: "🫧" },
  { id: "halftone", label: "Halftone", icon: "🏁" },
];

export function FilterStudioCard({
  filterConfig,
  onChangeFilterConfig,
  disabled = false,
}: FilterStudioCardProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "adjust" | "comic">("presets");

  const handleApplyPreset = (preset: FilterPreset) => {
    onChangeFilterConfig({
      ...DEFAULT_FILTER_CONFIG,
      ...preset.config,
      preset: preset.id,
      comicEffect: filterConfig.comicEffect,
      comicEffectColor: filterConfig.comicEffectColor,
      comicEffectOpacity: filterConfig.comicEffectOpacity,
    });
  };

  const handleReset = () => {
    onChangeFilterConfig(DEFAULT_FILTER_CONFIG);
  };

  const hasActiveFilters =
    filterConfig.brightness !== 0 ||
    filterConfig.contrast !== 0 ||
    filterConfig.saturation !== 0 ||
    filterConfig.hue !== 0 ||
    (filterConfig.posterizeLevels ?? 0) > 0 ||
    (filterConfig.pixelSize ?? 0) > 0 ||
    filterConfig.comicEffect !== "none" ||
    filterConfig.preset !== "none";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111b21] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Visual Filters & Comic FX</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400">Comic halftone, speed lines & pop-art color</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset all filters & effects"
              className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-500/20 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/30 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}

          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
              hasActiveFilters
                ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-300"
                : "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
            }`}
          >
            {hasActiveFilters ? "Filtered" : "Normal"}
          </span>
        </div>
      </div>

      {/* Sub-tabs: Presets, Fine Adjustments, Comic Background */}
      <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 dark:bg-[#182229] p-1 border border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "presets"
              ? "bg-white text-slate-900 shadow-sm dark:bg-[#202c33] dark:text-white"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Palette className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("adjust")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "adjust"
              ? "bg-white text-slate-900 shadow-sm dark:bg-[#202c33] dark:text-white"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Adjust</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("comic")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "comic"
              ? "bg-white text-slate-900 shadow-sm dark:bg-[#202c33] dark:text-white"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span>Comic FX</span>
        </button>
      </div>

      {/* Tab 1: 1-Click Filter Presets */}
      {activeTab === "presets" && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FILTER_PRESETS.map((preset) => {
            const isSelected = filterConfig.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => handleApplyPreset(preset)}
                className={`group flex flex-col items-start rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-50/80 text-cyan-950 dark:border-cyan-400 dark:bg-cyan-500/20 dark:text-cyan-100 shadow-sm ring-1 ring-cyan-500/40 font-bold"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-[#182229] text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:bg-[#202c33]"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {preset.name}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />}
                </div>
                <span className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-1">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 2: Fine-Tuning Sliders */}
      {activeTab === "adjust" && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-[#182229] p-4">
          {/* Brightness */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5 text-amber-500" /> Brightness
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{filterConfig.brightness}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={filterConfig.brightness}
              onChange={(e) =>
                onChangeFilterConfig({
                  ...filterConfig,
                  brightness: Number(e.target.value),
                  preset: "none",
                })
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-emerald-500"
            />
          </div>

          {/* Contrast */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Contrast className="h-3.5 w-3.5 text-indigo-500" /> Contrast
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{filterConfig.contrast}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={filterConfig.contrast}
              onChange={(e) =>
                onChangeFilterConfig({
                  ...filterConfig,
                  contrast: Number(e.target.value),
                  preset: "none",
                })
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-emerald-500"
            />
          </div>

          {/* Saturation */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-pink-500" /> Saturation
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{filterConfig.saturation}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={filterConfig.saturation}
              onChange={(e) =>
                onChangeFilterConfig({
                  ...filterConfig,
                  saturation: Number(e.target.value),
                  preset: "none",
                })
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-emerald-500"
            />
          </div>

          {/* Hue Rotation */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Hue Color Shift</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{filterConfig.hue}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={filterConfig.hue}
              onChange={(e) =>
                onChangeFilterConfig({
                  ...filterConfig,
                  hue: Number(e.target.value),
                  preset: "none",
                })
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-emerald-500"
            />
          </div>

          {/* Posterize (Cel-Shading) */}
          <div className="flex flex-col gap-1.5 border-t border-slate-200 dark:border-white/10 pt-2.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Comic Cel Shading (Posterize)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {filterConfig.posterizeLevels ? `${filterConfig.posterizeLevels} levels` : "Off"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              value={filterConfig.posterizeLevels || 0}
              onChange={(e) =>
                onChangeFilterConfig({
                  ...filterConfig,
                  posterizeLevels: Number(e.target.value),
                  preset: "none",
                })
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-emerald-500"
            />
          </div>

          {/* Pixelate (8-Bit Retro) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">8-Bit Pixel Block Size</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {filterConfig.pixelSize ? `${filterConfig.pixelSize}px` : "Off"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              value={filterConfig.pixelSize || 0}
              onChange={(e) =>
                onChangeFilterConfig({
                  ...filterConfig,
                  pixelSize: Number(e.target.value),
                  preset: "none",
                })
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Comic Action Background FX */}
      {activeTab === "comic" && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-[#182229] p-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Action Background Pattern</span>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {COMIC_EFFECT_OPTIONS.map((item) => {
                const isCurrent = filterConfig.comicEffect === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onChangeFilterConfig({
                        ...filterConfig,
                        comicEffect: item.id,
                      })
                    }
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                      isCurrent
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-white font-bold shadow-xs scale-105"
                        : "border-slate-200 bg-white text-slate-800 shadow-xs hover:border-slate-300 dark:border-white/10 dark:bg-[#202c33] dark:text-zinc-200 dark:hover:bg-[#2a3942]"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[11px] leading-tight font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filterConfig.comicEffect !== "none" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col gap-3 border-t border-slate-200 dark:border-white/10 pt-2.5"
            >
              {/* Comic Effect Color */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Pattern Color:</span>
                <div className="flex items-center gap-1.5">
                  {["#facc15", "#f43f5e", "#06b6d4", "#ffffff", "#000000", "#a855f7"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        onChangeFilterConfig({ ...filterConfig, comicEffectColor: c })
                      }
                      className={`h-5 w-5 rounded-full border transition-all cursor-pointer ${
                        (filterConfig.comicEffectColor || "#facc15").toLowerCase() === c.toLowerCase()
                          ? "ring-2 ring-emerald-500 scale-110 border-white shadow-sm"
                          : "border-slate-300 dark:border-white/20 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={filterConfig.comicEffectColor || "#facc15"}
                    onChange={(e) =>
                      onChangeFilterConfig({ ...filterConfig, comicEffectColor: e.target.value })
                    }
                    className="h-6 w-6 cursor-pointer rounded-lg border-0 bg-transparent"
                  />
                </div>
              </div>

              {/* Comic Effect Opacity */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Pattern Intensity</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {Math.round((filterConfig.comicEffectOpacity ?? 0.75) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={filterConfig.comicEffectOpacity ?? 0.75}
                  onChange={(e) =>
                    onChangeFilterConfig({
                      ...filterConfig,
                      comicEffectOpacity: Number(e.target.value),
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-zinc-700 accent-emerald-500"
                />
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterStudioCard;
