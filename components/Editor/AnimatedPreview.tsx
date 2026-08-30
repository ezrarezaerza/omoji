"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Film,
  Sparkles,
  Play,
  Pause,
  Zap,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Clock,
  FastForward,
  X,
} from "lucide-react";

export interface AnimatedPreviewProps {
  file: File;
  onConvertToSticker: (file: File) => void;
  onSkipAndAddDirectly?: (file: File) => void;
  onCancel: () => void;
  isConverting?: boolean;
  conversionProgress?: number;
  conversionStatusText?: string;
  autoStart?: boolean;
}

export function AnimatedPreview({
  file,
  onConvertToSticker,
  onSkipAndAddDirectly,
  onCancel,
  isConverting = false,
  conversionProgress = 0,
  conversionStatusText = "Auto-formatting for WhatsApp (6s max)...",
  autoStart = true,
}: AnimatedPreviewProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const autoStartedRef = useRef(false);

  const isVideo = file.type === "video/mp4";
  const isGif = file.type === "image/gif";
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setMediaUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Automated pipeline trigger upon file drop
  useEffect(() => {
    if (autoStart && !isConverting && !autoStartedRef.current) {
      autoStartedRef.current = true;
      onConvertToSticker(file);
    }
  }, [autoStart, file, isConverting, onConvertToSticker]);

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleDirectAdd = () => {
    if (onSkipAndAddDirectly) {
      onSkipAndAddDirectly(file);
    } else {
      onCancel();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative w-full overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-b from-white/[0.09] via-white/[0.04] to-[#120f24] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl"
    >
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-pink-600/15 blur-3xl" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-400/40 bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white shadow-lg shadow-purple-900/30">
            {isConverting ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Film className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-white font-['Space_Grotesk']">
                {isConverting ? "Formatting Animated Sticker" : "Animated Source Ready"}
              </h3>
              <span className="rounded-full border border-purple-400/40 bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-purple-200">
                {isGif ? "GIF Animation" : "MP4 Video"}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {file.name} • {fileSizeMb} MB {duration ? `• ${duration.toFixed(1)}s source` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Skip button when converting */}
          {isConverting && (
            <button
              id="skip-and-add-direct-btn"
              type="button"
              onClick={handleDirectAdd}
              className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition"
              title="Skip WebAssembly encoding and add sticker instantly"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span>Add Directly</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/15 hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Main Bento Body Grid */}
      <div className="relative z-10 mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
        {/* Left: Interactive Media Preview Container */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative aspect-square w-full max-w-[380px] sm:max-w-[420px] overflow-hidden rounded-3xl border-2 border-white/20 bg-zinc-950 shadow-2xl group">
            {/* Sticker Transparency Grid Background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #27272a 25%, transparent 25%), linear-gradient(-45deg, #27272a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #27272a 75%), linear-gradient(-45deg, transparent 75%, #27272a 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              }}
            />

            {/* Media Rendering */}
            {mediaUrl && (
              <div className="relative flex h-full w-full items-center justify-center p-3">
                {isVideo ? (
                  <video
                    ref={videoRef}
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onLoadedMetadata={handleLoadedMetadata}
                    className="max-h-full max-w-full rounded-2xl object-contain shadow-md"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={file.name}
                    className="max-h-full max-w-full rounded-2xl object-contain shadow-md"
                  />
                )}
              </div>
            )}

            {/* Video Play/Pause Overlay Controls */}
            {isVideo && (
              <button
                type="button"
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pause Video" : "Play Video"}
                className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-black/70 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-90"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
            )}

            {/* 512x512 Target Dimension & 6s limit Tag */}
            <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-bold text-zinc-300 backdrop-blur-md">
              <Clock className="h-3 w-3 text-amber-400" />
              <span>Target: 512×512 • 6s Loop</span>
            </div>
          </div>
        </div>

        {/* Right: Conversion Specifications & Action Bento */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              WhatsApp Automated Pipeline
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Auto-crops first 6 seconds to exact 512×512 square format.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>12 FPS & -qscale 50 compression to ensure file stays under 500KB.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Encodes lossless/near-lossless infinite loop (-loop 0).</span>
              </li>
            </ul>
          </div>

          {/* Prominent Primary Conversion & Status Card */}
          <div
            className={`relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border p-5 shadow-2xl transition-all ${
              isConverting
                ? "border-amber-500/50 bg-amber-950/20 text-white shadow-amber-950/30"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            {isConverting ? (
              <div className="w-full space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-amber-300 font-['Space_Grotesk']">
                      Formatting for WhatsApp...
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {conversionStatusText}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-amber-400 shrink-0">
                    {conversionProgress}%
                  </span>
                </div>

                {/* HeroUI / Tailwind Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900 ring-1 ring-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 rounded-full"
                    initial={{ width: "5%" }}
                    animate={{ width: `${Math.max(5, conversionProgress)}%` }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleDirectAdd}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2"
                  >
                    <FastForward className="h-3 w-3" /> Skip wait and add directly
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-[11px] text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2">
                <motion.button
                  id="convert-to-whatsapp-sticker-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => onConvertToSticker(file)}
                  className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-5 py-3.5 text-sm font-extrabold text-zinc-950 shadow-xl shadow-orange-500/30 transition-all hover:shadow-orange-500/50 cursor-pointer"
                >
                  <Sparkles className="h-5 w-5 text-zinc-950 fill-zinc-950/20" />
                  <span className="tracking-tight text-base font-black">
                    Convert to WhatsApp Sticker
                  </span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </motion.button>

                <button
                  type="button"
                  onClick={handleDirectAdd}
                  className="w-full text-center text-xs font-semibold text-zinc-400 hover:text-amber-300 py-1 transition"
                >
                  Or add directly without WASM re-encoding
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-zinc-400">
            {isConverting
              ? "Running client-side conversion. You can skip at any time to add directly."
              : "Loops seamlessly when sent in WhatsApp chats & groups."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default AnimatedPreview;
