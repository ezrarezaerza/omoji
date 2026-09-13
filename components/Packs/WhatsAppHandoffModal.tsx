"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Download,
  QrCode,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Send,
  HelpCircle,
  FolderArchive,
  Star,
  Info,
  Layers,
  Share2,
  Terminal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StickerPackRecord } from "../../src/types/pack";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";
import {
  getDeviceEnvironment,
  DeviceEnvironment,
} from "../../utils/whatsappBridge";
import { exportWaStickersBundle } from "../../utils/packExporter";
import {
  shareStickerToWhatsApp,
  copyStickerToClipboard,
  canWebShareFiles,
} from "../../utils/whatsappTransfer";
import { triggerHaptic } from "../../utils/haptics";
import QRCode from "qrcode";

interface WhatsAppHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: StickerPackRecord;
  onNavigateToSlot?: (slotIndex: number) => void;
}

export function WhatsAppHandoffModal({
  isOpen,
  onClose,
  pack,
  onNavigateToSlot,
}: WhatsAppHandoffModalProps) {
  const [activeTab, setActiveTab] = useState<"direct_chat" | "archive" | "qr" | "native">("direct_chat");
  const [deviceEnv, setDeviceEnv] = useState<DeviceEnvironment>(getDeviceEnvironment());
  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number>(0);
  const [isSharingSticker, setIsSharingSticker] = useState(false);
  const [shareNotice, setShareNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // QR Code State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Archive export state
  const [isExportingArchive, setIsExportingArchive] = useState(false);

  const stickers = pack.stickers || [];
  const occupiedCount = stickers.length;
  const isCountValid = occupiedCount >= 3 && occupiedCount <= 30;

  // Direct share link that opens on mobile with add-to-whatsapp action
  const mobileDeepLink = typeof window !== "undefined"
    ? `${window.location.origin}/?packId=${encodeURIComponent(pack.id)}&action=add-to-whatsapp`
    : "";

  useEffect(() => {
    if (isOpen) {
      const env = getDeviceEnvironment();
      setDeviceEnv(env);
      setShareNotice(null);
      setIsSharingSticker(false);

      // Select default tab: if desktop -> qr; if mobile -> direct_chat
      if (env.isDesktop) {
        setActiveTab("qr");
      } else {
        setActiveTab("direct_chat");
      }

      // Generate dynamic QR code targeting this pack
      if (mobileDeepLink) {
        QRCode.toDataURL(mobileDeepLink, {
          width: 320,
          margin: 2,
          color: {
            dark: "#0b0914",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        })
          .then((url) => setQrCodeDataUrl(url))
          .catch((err) => console.warn("QR code generation error:", err));
      }
    }
  }, [isOpen, pack.id, mobileDeepLink]);

  // Share a specific sticker directly to WhatsApp
  const handleShareSticker = async (index: number) => {
    const sticker = stickers[index];
    if (!sticker?.imageUrl) return;

    triggerHaptic("medium");
    setIsSharingSticker(true);
    setShareNotice(null);

    try {
      const res = await shareStickerToWhatsApp(sticker.imageUrl, {
        title: `${pack.title} - Sticker #${index + 1}`,
        text: `WhatsApp Sticker from "${pack.title}" by ${pack.publisher || "Omoji"}`,
        fileName: `${pack.title.replace(/[^a-z0-9_-]/gi, "_")}_sticker_${index + 1}`,
        format: "webp",
      });

      if (res.success) {
        triggerHaptic("success");
        if (res.method === "native-share") {
          setShareNotice({
            type: "success",
            text: "✅ WhatsApp sharing sheet opened! Send to any chat or 'Message yourself', then tap the sticker and select ⭐ 'Add to Favorites'.",
          });
        } else if (res.method === "clipboard") {
          setShareNotice({
            type: "success",
            text: "📋 Sticker copied to clipboard! Paste (Ctrl+V) directly into WhatsApp Web or desktop chat.",
          });
        } else {
          setShareNotice({
            type: "info",
            text: "📥 Sticker downloaded! Drag & drop it directly into your WhatsApp chat.",
          });
        }
      } else {
        triggerHaptic("error");
        setShareNotice({
          type: "error",
          text: res.message || "Sharing was cancelled or unsupported on this device.",
        });
      }
    } catch (err: any) {
      triggerHaptic("error");
      setShareNotice({
        type: "error",
        text: err?.message || "Failed to share sticker to WhatsApp.",
      });
    } finally {
      setIsSharingSticker(false);
    }
  };

  // Direct download of .wastickers
  const handleDownloadWastickers = async () => {
    triggerHaptic("light");
    setIsExportingArchive(true);
    try {
      const res = await exportWaStickersBundle({
        packName: pack.title,
        authorName: pack.publisher || "Omoji Creator",
        stickers: stickers.map((s, idx) => ({
          source: s.imageUrl,
          emojis: s.emojis || ["✨"],
          name: `sticker_${(s.slotIndex ?? idx) + 1}`,
          isAnimated: s.isAnimated,
        })),
        trayIcon: pack.trayIconUrl,
      });

      const blobUrl = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      triggerHaptic("success");

      setShareNotice({
        type: "success",
        text: `📦 Downloaded ${res.filename}! Tap the file in your notification bar and open with 'WhatsApp' or 'Sticker Maker' to import all stickers at once.`,
      });
    } catch (err: any) {
      triggerHaptic("error");
      setShareNotice({
        type: "error",
        text: err.message || "Failed to export sticker pack.",
      });
    } finally {
      setIsExportingArchive(false);
    }
  };

  const handleCopyLink = () => {
    triggerHaptic("light");
    if (mobileDeepLink) {
      navigator.clipboard.writeText(mobileDeepLink).then(() => {
        setHasCopiedLink(true);
        triggerHaptic("success");
        setTimeout(() => setHasCopiedLink(false), 2500);
      });
    }
  };

  const handleSendViaWhatsAppWeb = () => {
    triggerHaptic("light");
    const shareText = `🔥 Check out "${pack.title}" WhatsApp sticker pack by ${pack.publisher || "Omoji"}!\nTap to install directly: ${mobileDeepLink}`;
    const webUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(webUrl, "_blank");
  };

  const currentSticker = stickers[selectedStickerIndex] || stickers[0];

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add to WhatsApp"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 p-1 font-sans">
        {/* Pack Quick Header Banner */}
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-emerald-500/30 bg-white dark:bg-zinc-900 p-1 shadow-xs">
            {pack.trayIconUrl ? (
              <img
                src={pack.trayIconUrl}
                alt={pack.title}
                className="h-full w-full object-contain"
                crossOrigin="anonymous"
              />
            ) : stickers[0]?.imageUrl ? (
              <img
                src={stickers[0].imageUrl}
                alt={pack.title}
                className="h-full w-full object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#25D366]">
                <Sparkles className="h-6 w-6" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-black text-slate-900 dark:text-white font-['Space_Grotesk']">
                {pack.title}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black border ${
                  isCountValid
                    ? "border-emerald-500/30 bg-[#25D366]/20 text-[#25D366]"
                    : "border-amber-500/30 bg-amber-500/20 text-amber-600 dark:text-amber-400"
                }`}
              >
                {occupiedCount}/30 Stickers
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Publisher: <span className="font-bold text-slate-700 dark:text-zinc-300">{pack.publisher || "Omoji Creator"}</span>
            </p>
          </div>
        </div>

        {/* Informative Explanation Banner: Why Google Play Opened */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-900 dark:text-blue-200">
          <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Why did Google Play open previously?</strong> WhatsApp does not allow websites to inject stickers directly into its internal keyboard without an Android system app installed. 
            <span className="block mt-0.5 opacity-90">
              👉 Use <strong>Method 1 (Send to Chat & Favorite ⭐)</strong> or <strong>Method 2 (Open with Sticker Maker)</strong> below to use your stickers in WhatsApp right now without installing anything!
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-white/10 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("direct_chat");
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "direct_chat"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            <Send className="h-4 w-4" />
            <span>1. Send to WhatsApp (Instant ⭐)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("archive");
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "archive"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            <FolderArchive className="h-4 w-4" />
            <span>2. Download Sticker Pack</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("qr");
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "qr"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Mobile Scan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("native");
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "native"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Native App Info</span>
          </button>
        </div>

        {/* Tab 1: Direct Send to WhatsApp Chat & Add to Favorites */}
        {activeTab === "direct_chat" && (
          <div className="space-y-4">
            {/* Step-by-Step Instructions Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-black text-black">
                  1
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Tap <strong>"Send to WhatsApp"</strong> below. When your phone's share sheet appears, select <strong>WhatsApp</strong> and send to any chat (or <strong>"Message yourself"</strong>).
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black text-black">
                  2
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  In WhatsApp, <strong>tap on the sticker in the chat</strong> and tap <span className="font-bold text-amber-500">⭐ Add to Favorites</span>. It will now be saved in your WhatsApp sticker drawer permanently!
                </p>
              </div>
            </div>

            {/* Sticker Preview & Carousel Picker */}
            {stickers.length > 0 ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Select Sticker to Send ({selectedStickerIndex + 1} of {stickers.length})
                  </span>
                  <span className="text-[10px] text-slate-500">Tap sticker to select</span>
                </div>

                {/* Horizontal mini-tray of stickers */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                  {stickers.map((s, idx) => (
                    <button
                      key={s.id || idx}
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setSelectedStickerIndex(idx);
                      }}
                      className={`relative h-14 w-14 shrink-0 rounded-xl border-2 p-1 transition-all cursor-pointer ${
                        selectedStickerIndex === idx
                          ? "border-[#25D366] bg-emerald-500/10 scale-105 shadow-md shadow-emerald-500/20"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={s.imageUrl}
                        alt={`Sticker ${idx + 1}`}
                        className="h-full w-full object-contain"
                        crossOrigin="anonymous"
                      />
                      <span className="absolute -bottom-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Large Preview & Action Button */}
                {currentSticker && (
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-slate-200/60 dark:border-white/10">
                    <div className="h-24 w-24 shrink-0 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-zinc-900 p-2 shadow-inner flex items-center justify-center">
                      <img
                        src={currentSticker.imageUrl}
                        alt="Selected Sticker"
                        className="h-full w-full object-contain"
                        crossOrigin="anonymous"
                      />
                    </div>

                    <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Sticker #{selectedStickerIndex + 1}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Format: 512x512 Transparent WebP (Official WhatsApp Standard)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleShareSticker(selectedStickerIndex)}
                        disabled={isSharingSticker}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-xs font-black text-black shadow-lg shadow-emerald-500/25 hover:bg-[#20bd5a] active:scale-95 transition-all cursor-pointer font-['Space_Grotesk'] disabled:opacity-50"
                      >
                        {isSharingSticker ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Opening WhatsApp...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 stroke-[2.5]" />
                            <span>Send Sticker #{selectedStickerIndex + 1} to WhatsApp</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                No stickers found in this pack yet. Create at least 1 sticker to share!
              </div>
            )}

            {/* Notification feedback */}
            {shareNotice && (
              <div
                className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${
                  shareNotice.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                    : shareNotice.type === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200"
                    : "border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200"
                }`}
              >
                {shareNotice.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{shareNotice.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Whole Pack (.wastickers - Universal Import) */}
        {activeTab === "archive" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-5 space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Download Complete WhatsApp Pack
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Save all {occupiedCount} stickers at once to add directly to your WhatsApp stickers drawer.
                </p>
              </div>

              {/* 3 Step Visual Guide */}
              <div className="space-y-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-3 text-xs">
                <span className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">
                  How to Add Pack to WhatsApp:
                </span>
                <ol className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <li className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[10px] font-black text-black">
                      1
                    </span>
                    <span>Tap <strong>&ldquo;Download Pack&rdquo;</strong> below.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[10px] font-black text-black">
                      2
                    </span>
                    <span>Open the downloaded file on your mobile device.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[10px] font-black text-black">
                      3
                    </span>
                    <span>Select <strong>WhatsApp</strong> and tap <strong>&ldquo;Add to WhatsApp&rdquo;</strong>!</span>
                  </li>
                </ol>
              </div>

              <button
                type="button"
                onClick={handleDownloadWastickers}
                disabled={!isCountValid || isExportingArchive}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-xs font-black text-white shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                {isExportingArchive ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Preparing {occupiedCount} Stickers...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 stroke-[2.5]" />
                    <span>Download WhatsApp Pack ({occupiedCount} Stickers)</span>
                  </>
                )}
              </button>

              {!isCountValid && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  ⚠️ WhatsApp requires at least 3 stickers in a pack to bundle (currently {occupiedCount}).
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Mobile Scan (QR Code) */}
        {activeTab === "qr" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-5">
              {qrCodeDataUrl ? (
                <div className="rounded-2xl bg-white p-3 shadow-md border border-slate-200 shrink-0">
                  <img
                    src={qrCodeDataUrl}
                    alt="Scan to Add Sticker Pack"
                    className="h-48 w-48 object-contain"
                  />
                </div>
              ) : (
                <div className="h-48 w-48 rounded-2xl bg-slate-200 dark:bg-white/10 animate-pulse shrink-0" />
              )}

              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/20 px-2.5 py-0.5 text-[11px] font-black text-[#25D366] border border-[#25D366]/30">
                  <Sparkles className="h-3 w-3" />
                  <span>Desktop to Mobile Handoff</span>
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Scan with your Phone Camera
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Open your mobile camera or QR reader. Tapping the link opens Omoji directly on your phone with this pack ready to send to WhatsApp.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/15 active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    {hasCopiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#25D366]" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Mobile Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendViaWhatsAppWeb}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send to WhatsApp Web</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Native Companion App Info */}
        {activeTab === "native" && (
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                <Terminal className="h-4 w-4 text-[#25D366]" />
                <span>How WhatsApp's Native System Works</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                To start using your stickers in WhatsApp immediately, use <strong>Method 1 (Send to Chat &amp; Favorite ⭐)</strong> or <strong>Method 2 (Download Sticker Pack)</strong> for a smooth, instant experience!
              </p>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
