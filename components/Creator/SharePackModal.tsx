"use client";

import React, { useState } from "react";
import {
  Share2,
  MessageCircle,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ExternalLink,
  Twitter,
  Send,
  Download,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BaseModal } from "../UI/BaseModal";

interface SharePackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "pack" | "creator";
  title: string;
  creatorName?: string;
  creatorUsername?: string;
  shareUrl: string;
  imageUrl?: string;
  stickersCount?: number;
  onShowNotice?: (message: string) => void;
}

export function SharePackModal({
  isOpen,
  onClose,
  type,
  title,
  creatorName,
  creatorUsername,
  shareUrl,
  imageUrl,
  stickersCount,
  onShowNotice,
}: SharePackModalProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const fullShareUrl = typeof window !== "undefined"
    ? (shareUrl.startsWith("http") ? shareUrl : `${window.location.origin}${shareUrl}`)
    : shareUrl;

  const shareText =
    type === "pack"
      ? `🔥 Check out "${title}" sticker pack${
          creatorName ? ` by ${creatorName}` : ""
        } on Omoji! Export directly to WhatsApp: ${fullShareUrl}`
      : `✨ Check out sticker creator @${creatorUsername || title} on Omoji! Discover verified WhatsApp sticker packs: ${fullShareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShareUrl).then(() => {
      setHasCopied(true);
      onShowNotice?.("📋 Link copied to clipboard!");
      setTimeout(() => setHasCopied(false), 2500);
    });
  };

  const handleWhatsAppShare = () => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const handleTelegramShare = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(fullShareUrl)}&text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: fullShareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  // Quick SVG QR code visual generator using api.qrserver.com or simple inline SVG
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    fullShareUrl
  )}&bgcolor=111b21&color=25D366&margin=1`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={type === "pack" ? "Share Sticker Pack" : "Share Creator Profile"}
      subtitle="Send directly to WhatsApp chats, group threads, or social channels"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-5">
        {/* Preview Card */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-[#111b21] p-3.5 shadow-xs">
          {imageUrl && (
            <div className="relative shrink-0">
              <img
                src={imageUrl}
                alt={title}
                className="h-14 w-14 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shadow-xs"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-white font-['Space_Grotesk'] truncate">
              {title}
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {type === "pack"
                ? `${stickersCount ? `${stickersCount} stickers • ` : ""}by ${
                    creatorName || "Artist"
                  }`
                : `@${creatorUsername || "creator"} • Verified Artist`}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-[#25D366] truncate">
              <Sparkles className="h-3 w-3 shrink-0" />
              <span>WhatsApp WebP Instant Import</span>
            </div>
          </div>
        </div>

        {/* Primary 1-Tap WhatsApp Share Action */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-3.5 text-xs font-black text-black shadow-lg shadow-emerald-600/25 hover:brightness-105 active:scale-98 transition-all cursor-pointer font-['Space_Grotesk']"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Send Directly to WhatsApp</span>
        </button>

        {/* Secondary Social Channels Grid */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleTwitterShare}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <Twitter className="h-3.5 w-3.5 text-sky-500" />
            <span>X / Twitter</span>
          </button>

          <button
            type="button"
            onClick={handleTelegramShare}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5 text-blue-500" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#182229] p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-purple-500" />
            <span>More...</span>
          </button>
        </div>

        {/* Deep Link Copy Bar */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#182229] p-1.5 pl-3.5 shadow-xs">
          <span className="text-xs font-mono text-slate-400 truncate flex-1 select-all">
            {fullShareUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              hasCopied
                ? "bg-emerald-500/15 text-[#25D366]"
                : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            }`}
          >
            {hasCopied ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* QR Code Toggle Section */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer py-1"
          >
            <span className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-[#25D366]" />
              <span>Display QR Code for Group Posters</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {showQr ? "Hide" : "Show"}
            </span>
          </button>

          {showQr && (
            <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-900 p-4 text-center">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="h-44 w-44 rounded-xl object-contain border border-[#25D366]/30 shadow-md"
              />
              <p className="mt-2 text-[10px] font-mono text-slate-400">
                Scan with mobile camera to open &amp; install directly on WhatsApp
              </p>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
