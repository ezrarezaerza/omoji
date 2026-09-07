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
  Layers,
  Share2,
  Terminal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StickerPackRecord } from "../../src/types/pack";
import { ResponsiveDialog } from "../UI/ResponsiveDialog";
import {
  getDeviceEnvironment,
  checkWhatsAppAvailability,
  installPackToWhatsApp,
  DeviceEnvironment,
} from "../../utils/whatsappBridge";
import { exportWaStickersBundle } from "../../utils/packExporter";
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
  const [activeTab, setActiveTab] = useState<"1tap" | "qr" | "archive" | "companion">("1tap");
  const [deviceEnv, setDeviceEnv] = useState<DeviceEnvironment>(getDeviceEnvironment());
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStep, setInstallStep] = useState<string>("");
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [installResult, setInstallResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

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
      setInstallResult(null);
      setIsInstalling(false);
      setInstallProgress(0);

      // Select default tab: if mobile or native -> 1tap; if desktop -> qr
      if (env.isDesktop) {
        setActiveTab("qr");
      } else {
        setActiveTab("1tap");
      }

      // Generate dynamic QR code targeting this pack's 1-tap mobile launcher
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

  // Execute 1-Tap Installation
  const handleExecuteInstall = async () => {
    triggerHaptic("medium");
    setIsInstalling(true);
    setInstallResult(null);
    setInstallProgress(10);
    setInstallStep("Checking pack compliance & assets...");

    try {
      const result = await installPackToWhatsApp(pack, {
        onProgress: (step, percent) => {
          setInstallStep(step);
          setInstallProgress(percent);
        },
      });

      setInstallResult(result);
      if (result.success) {
        triggerHaptic("success");
      } else {
        triggerHaptic("error");
      }
    } catch (err: any) {
      triggerHaptic("error");
      setInstallResult({
        success: false,
        message: err?.message || "An unexpected error occurred during installation.",
      });
    } finally {
      setIsInstalling(false);
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
    } catch (err: any) {
      triggerHaptic("error");
      alert(err.message || "Failed to download .wastickers archive.");
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

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add to WhatsApp"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5 p-1 font-sans">
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

        {/* Validation Warning if < 3 stickers */}
        {!isCountValid && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-black">WhatsApp Specification Requirement</p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                WhatsApp requires sticker packs to have a minimum of <strong>3 stickers</strong> and a maximum of <strong>30 stickers</strong>. Currently this pack has {occupiedCount}.
              </p>
              {onNavigateToSlot && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToSlot(occupiedCount);
                  }}
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Create Sticker #{occupiedCount + 1}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-white/10 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("1tap");
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "1tap"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>1-Tap Add</span>
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
              setActiveTab("archive");
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "archive"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            <FolderArchive className="h-4 w-4" />
            <span>.WASTICKERS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("companion");
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "companion"
                ? "bg-[#25D366] text-black shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Native Bridge</span>
          </button>
        </div>

        {/* Tab 1: 1-Tap Add to WhatsApp */}
        {activeTab === "1tap" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Target Platform & Environment
                </span>
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-[#25D366] border border-emerald-500/20">
                  {deviceEnv.isNative
                    ? "Capacitor Native Container"
                    : deviceEnv.isAndroid
                    ? "Android Web"
                    : deviceEnv.isIOS
                    ? "iOS Web"
                    : "Desktop Browser"}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {deviceEnv.isNative
                  ? "Running inside Omoji Native App. Tapping below will directly invoke the ContentProvider bridge to add this pack to your WhatsApp sticker drawer."
                  : deviceEnv.isAndroid
                  ? "Tapping below dispatches Android's official ENABLE_STICKER_PACK intent directly into WhatsApp Messenger or WhatsApp Business."
                  : deviceEnv.isIOS
                  ? "Tapping below dispatches the WhatsApp iOS deep-link scheme to prompt adding the sticker pack."
                  : "You are currently on a desktop browser. For the fastest experience, scan the QR code under the Mobile Scan tab with your phone camera, or export the .wastickers archive."}
              </p>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleExecuteInstall}
              disabled={!isCountValid || isInstalling}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 py-4 text-sm font-black text-black shadow-lg shadow-emerald-500/25 hover:bg-[#20bd5a] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-['Space_Grotesk']"
            >
              {isInstalling ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>{installStep || "Adding to WhatsApp..."}</span>
                </>
              ) : (
                <>
                  <Smartphone className="h-5 w-5 stroke-[2.5]" />
                  <span>Add to WhatsApp ({occupiedCount} Stickers)</span>
                </>
              )}
            </button>

            {/* In-Progress Bar */}
            {isInstalling && (
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-[#25D366] transition-all duration-300 rounded-full"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>{installStep}</span>
                  <span>{installProgress}%</span>
                </div>
              </div>
            )}

            {/* Result Feedback Banner */}
            {installResult && (
              <div
                className={`rounded-2xl border p-4 text-xs space-y-2 ${
                  installResult.success
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300"
                }`}
              >
                <div className="flex items-center gap-2 font-black">
                  {installResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span>{installResult.success ? "Success!" : "Notice"}</span>
                </div>
                <p className="leading-relaxed opacity-90">{installResult.message}</p>
                {!installResult.success && deviceEnv.isDesktop && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("qr")}
                    className="mt-1 inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-[#25D366] underline cursor-pointer"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Switch to Mobile Scan QR code</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Mobile Scan (QR Code) */}
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
                  Open your mobile camera or QR reader. Tapping the link opens Omoji directly on your phone with this pack ready for 1-tap addition to WhatsApp.
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

        {/* Tab 3: .WASTICKERS Archive Export */}
        {activeTab === "archive" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-5 space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Universal WhatsApp Package (.wastickers)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                A single bundled file containing all 512x512 WebP cutouts, 96x96 tray icon, metadata, and WhatsApp-standard <code>contents.json</code>.
              </p>

              <button
                type="button"
                onClick={handleDownloadWastickers}
                disabled={!isCountValid || isExportingArchive}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs font-black text-white shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                {isExportingArchive ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Bundling .wastickers...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 stroke-[2.5]" />
                    <span>Download {pack.title}.wastickers</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-white/5 p-4 text-xs space-y-2">
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Import Instructions:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                <li>Download the <code>.wastickers</code> file above.</li>
                <li>Tap the downloaded file in your notification bar or file manager.</li>
                <li>Choose <strong>WhatsApp</strong> or sticker importer app (e.g., Sticker Maker) to add to your sticker keyboard.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 4: Native Companion & Architecture */}
        {activeTab === "companion" && (
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                <Terminal className="h-4 w-4 text-[#25D366]" />
                <span>Omoji Native Sticker Architecture</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Omoji includes a full native Capacitor wrapper configured with official Android ContentProvider and iOS Pasteboard bridges:
              </p>

              <div className="space-y-1.5 font-mono text-[11px] bg-black/80 text-emerald-400 p-3 rounded-xl border border-white/10 overflow-x-auto">
                <div>Android Authority: com.omoji.stickers.provider</div>
                <div>Action: com.whatsapp.intent.action.ENABLE_STICKER_PACK</div>
                <div>iOS Pasteboard: net.whatsapp.WhatsApp.stickerpack</div>
                <div>Universal Deep Link: omoji://add-pack?id={pack.id}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-white/5 p-4 space-y-2">
              <span className="font-black text-slate-900 dark:text-white">Run Native Container on Device:</span>
              <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-zinc-300 bg-slate-200/50 dark:bg-white/5 p-2.5 rounded-lg">
                <div>npx cap sync</div>
                <div>npx cap open android</div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Running in Android Studio or Xcode enables 100% direct native installation without relying on third-party companion tools.
              </p>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
