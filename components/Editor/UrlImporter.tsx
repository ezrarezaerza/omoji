"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Globe,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { importAssetFromUrl } from "../../utils/importExternalAsset";

export interface UrlImporterProps {
  onImageSelected: (imageUrl: string, file: File) => void;
  onAnimatedFileSelected?: (file: File) => void;
  onAssetUrlSelected?: (url: string) => Promise<void> | void;
}

const SAMPLE_URLS = [
  {
    name: "Cat Vibing GIF",
    url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
    type: "animated",
  },
  {
    name: "Doge Dance GIF",
    url: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif",
    type: "animated",
  },
  {
    name: "Pop Cat GIF",
    url: "https://media.giphy.com/media/ZeB5RzwVUoxWg2EvEl/giphy.gif",
    type: "animated",
  },
  {
    name: "Sample PNG Photo",
    url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80",
    type: "static",
  },
];

export function UrlImporter({
  onImageSelected,
  onAnimatedFileSelected,
  onAssetUrlSelected,
}: UrlImporterProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationHint, setValidationHint] = useState<string | null>(null);

  const validateUrl = (testUrl: string): boolean => {
    const trimmed = testUrl.trim();
    if (!trimmed) {
      setError("Please paste or type an image or GIF URL.");
      return false;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return false;
    }

    try {
      new URL(trimmed);
      return true;
    } catch {
      setError("Please enter a valid, well-formed URL.");
      return false;
    }
  };

  const handleImport = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || url).trim();
    setError(null);
    setValidationHint(null);

    if (!validateUrl(urlToFetch)) {
      return;
    }

    setIsLoading(true);

    try {
      if (onAssetUrlSelected) {
        await onAssetUrlSelected(urlToFetch);
        return;
      }

      const file = await importAssetFromUrl(urlToFetch);
      const mime = file.type.toLowerCase();
      const isAnimated =
        mime.includes("gif") ||
        mime.includes("mp4") ||
        file.name.toLowerCase().endsWith(".gif") ||
        file.name.toLowerCase().endsWith(".mp4");

      if (isAnimated && onAnimatedFileSelected) {
        onAnimatedFileSelected(file);
      } else {
        const previewUrl = URL.createObjectURL(file);
        onImageSelected(previewUrl, file);
      }
    } catch (err: any) {
      console.error("URL Import error:", err);
      setError(err?.message || "Failed to import image from URL. Please check the link and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-5">
      {/* URL Input Form Card */}
      <div className="relative rounded-2xl border-2 border-white/15 bg-white/[0.05] p-5 sm:p-6 backdrop-blur-xl transition-all">
        <label
          htmlFor="direct-url-input"
          className="block text-xs font-bold uppercase tracking-wider text-zinc-300 font-['Space_Grotesk'] mb-2 flex items-center gap-1.5"
        >
          <Globe className="h-3.5 w-3.5 text-amber-400" />
          Direct Web Image or GIF URL
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
            <input
              id="direct-url-input"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleImport();
                }
              }}
              placeholder="https://example.com/image.png or .gif..."
              className="w-full rounded-2xl border-2 border-white/15 bg-zinc-900/80 pl-12 pr-4 py-3.5 text-sm font-medium text-white placeholder-zinc-500 backdrop-blur-xl transition-all focus:border-amber-400 focus:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-amber-400/20"
            />
          </div>

          <motion.button
            id="import-url-submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={isLoading}
            onClick={() => handleImport()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-6 py-3.5 text-sm font-extrabold text-zinc-950 shadow-xl shadow-orange-500/25 transition-all hover:shadow-orange-500/40 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-zinc-950 fill-zinc-950/20" />
                <span>Import Asset</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </div>

        {/* Error Feedback */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/20 p-3 text-xs font-semibold text-rose-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          Paste any public direct image URL (PNG, JPG, WEBP) or animated GIF/MP4. The asset will be safely proxied to prevent canvas CORS security blocks.
        </p>
      </div>

      {/* Preset / Sample Quick Picks */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
          Or Try A Sample Link:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAMPLE_URLS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => {
                setUrl(sample.url);
                handleImport(sample.url);
              }}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left text-xs font-semibold text-zinc-300 hover:border-amber-400/50 hover:bg-white/10 hover:text-white transition group"
            >
              <div className="flex items-center gap-2 truncate">
                {sample.type === "animated" ? (
                  <Film className="h-4 w-4 text-purple-400 shrink-0" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
                <span className="truncate">{sample.name}</span>
              </div>
              <span className="shrink-0 text-[10px] font-mono text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Load →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UrlImporter;
