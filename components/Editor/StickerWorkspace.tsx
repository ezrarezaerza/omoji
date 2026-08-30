"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Type,
  Trash2,
  RotateCcw,
  Sparkles,
  Download,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Package,
  FolderArchive,
  ImagePlus,
  PanelRightOpen,
  Send,
  Flame,
  Eraser,
  Paintbrush,
  MousePointer,
  Sliders,
} from "lucide-react";
import { Uploader } from "./Uploader";
import { CanvasEditor, CanvasEditorHandle, TextElement } from "./CanvasEditor";
import { EditorToolbar } from "./EditorToolbar";
import { PackSidebar } from "./PackSidebar";
import { ExportModal } from "./ExportModal";
import { AnimatedPreview } from "./AnimatedPreview";
import { exportStageToWebP } from "../../utils/exportSticker";
import { convertToAnimatedWebp } from "../../utils/convertToAnimatedWebp";
import { importAssetFromUrl } from "../../utils/importExternalAsset";
import { useEditorState, MIN_BRUSH_SIZE, MAX_BRUSH_SIZE } from "../../hooks/useEditorState";
import { useFFmpeg } from "../../hooks/useFFmpeg";

export interface StickerWorkspaceProps {
  onBack?: () => void;
  onSaveToPack?: (stickerDataUrl: string) => void;
}

export function StickerWorkspace({ onBack, onSaveToPack }: StickerWorkspaceProps) {
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [animatedFile, setAnimatedFile] = useState<File | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatusText, setAiStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Phase 7.2: Client-side FFmpeg WebAssembly Hook & State
  const { ffmpeg, isReady: isFFmpegReady, loadFFmpeg } = useFFmpeg(false);
  const [isConvertingAnimated, setIsConvertingAnimated] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedStatusText, setAnimatedStatusText] = useState("Preparing WebAssembly engine...");

  // Phase 6.1: Editor Tool State Hook (Active Tool & Brush Size)
  const { activeTool, brushSize, setActiveTool, setBrushSize, toggleTool, isDrawingMode } = useEditorState("SELECT", 20);

  // Pack collection state
  const [packName, setPackName] = useState("My Awesome Stickers");
  const [authorName, setAuthorName] = useState("Sticker Creator");
  const [packStickers, setPackStickers] = useState<string[]>([]);

  // Canvas elements state
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Active text styling & color picker state
  const [textColor, setTextColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(8);
  const [colorMode, setColorMode] = useState<"fill" | "stroke">("fill");

  // UI Overlays state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isIngestingAsset, setIsIngestingAsset] = useState(false);
  const [ingestStatusText, setIngestStatusText] = useState("Fetching and preparing asset...");

  const canvasRef = useRef<CanvasEditorHandle>(null);

  const handleImageSelected = (url: string) => {
    setOriginalImageUrl(url);
    setActiveImageUrl(url);
    setAnimatedFile(null);
    setTextElements([]);
    setSelectedId(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAnimatedFileSelected = (file: File) => {
    setAnimatedFile(file);
    setOriginalImageUrl(null);
    setActiveImageUrl(null);
    setTextElements([]);
    setSelectedId(null);
    setErrorMessage(null);
  };

  const handleIngestAssetFromUrl = async (url: string) => {
    setIsIngestingAsset(true);
    setIngestStatusText("Fetching asset through CORS proxy...");
    setErrorMessage(null);

    try {
      const file = await importAssetFromUrl(url);
      const mime = file.type.toLowerCase();
      const isAnimated =
        mime.includes("gif") ||
        mime.includes("mp4") ||
        file.name.toLowerCase().endsWith(".gif") ||
        file.name.toLowerCase().endsWith(".mp4");

      if (isAnimated) {
        setIngestStatusText("Routing to automated 6-second animated pipeline...");
        handleAnimatedFileSelected(file);
      } else {
        setIngestStatusText("Setting up 512×512 sticker canvas...");
        const previewUrl = URL.createObjectURL(file);
        handleImageSelected(previewUrl);
      }
    } catch (err: any) {
      console.error("Asset ingestion failed:", err);
      setErrorMessage(err?.message || "Failed to import asset. Please check the URL or try another meme.");
    } finally {
      setIsIngestingAsset(false);
    }
  };

  const handleSkipAnimatedConversion = (file: File) => {
    const fallbackUrl = URL.createObjectURL(file);
    setPackStickers((prev) => {
      if (prev.length >= 30) {
        setErrorMessage("WhatsApp sticker packs hold a maximum of 30 stickers.");
        return prev;
      }
      return [...prev, fallbackUrl];
    });
    setSuccessMessage("Animated sticker added to your pack!");
    setAnimatedFile(null);
    setIsConvertingAnimated(false);
    setAnimatedProgress(0);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleConvertAnimatedSticker = async (file: File) => {
    setIsConvertingAnimated(true);
    setAnimatedProgress(10);
    setAnimatedStatusText("Preparing WhatsApp-compatible format...");
    setErrorMessage(null);

    // Hard fallback timeout: 8 seconds maximum total wait
    const safetyTimeout = setTimeout(() => {
      console.warn("Safety timeout reached in handleConvertAnimatedSticker. Adding sticker directly.");
      handleSkipAnimatedConversion(file);
    }, 8000);

    try {
      let engine = ffmpeg;
      if (!engine || !isFFmpegReady) {
        setAnimatedStatusText("Checking WebAssembly encoder (fast check)...");
        engine = await loadFFmpeg(4000);
      }

      setAnimatedProgress(25);
      setAnimatedStatusText("Formatting 512×512 square loop...");

      const webpBlob = await convertToAnimatedWebp(file, engine, {
        maxDurationSeconds: 6,
        fps: 12,
        quality: 50,
        targetSize: 512,
        timeoutMs: 6000,
        onProgress: (p) => {
          setAnimatedProgress(Math.max(25, Math.min(95, p)));
          setAnimatedStatusText(`Formatting sticker (${p}%)...`);
        },
      });

      clearTimeout(safetyTimeout);
      setAnimatedProgress(100);
      setAnimatedStatusText("Finalizing sticker...");

      const blobUrl = URL.createObjectURL(webpBlob);

      setPackStickers((prev) => {
        if (prev.length >= 30) {
          setErrorMessage("WhatsApp sticker packs hold a maximum of 30 stickers.");
          return prev;
        }
        return [...prev, blobUrl];
      });

      setSuccessMessage("Animated sticker added to your pack!");
      setAnimatedFile(null);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      console.warn("Animated conversion encountered fallback:", err);
      handleSkipAnimatedConversion(file);
    } finally {
      clearTimeout(safetyTimeout);
      setIsConvertingAnimated(false);
      setAnimatedProgress(0);
    }
  };

  const handleResetImage = () => {
    if (originalImageUrl) {
      setActiveImageUrl(originalImageUrl);
      setTextElements([]);
      setSelectedId(null);
      setSuccessMessage("Canvas reset to original photo.");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // AI Background Removal Engine
  const handleRemoveBackground = async () => {
    if (!activeImageUrl) return;

    setIsAiProcessing(true);
    setAiProgress(10);
    setAiStatusText("Detecting photo subject...");
    setErrorMessage(null);

    try {
      setAiProgress(30);
      setAiStatusText("Separating foreground...");
      
      let processedBlobUrl: string | null = null;

      await new Promise((r) => setTimeout(r, 400));
      setAiProgress(55);
      setAiStatusText("Cleaning up background...");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = activeImageUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      setAiProgress(80);
      setAiStatusText("Smoothing edges...");

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const d = imgData.data;

        // Sample boundary pixels to detect background chroma
        const cornerSamples = [
          [0, 0],
          [tempCanvas.width - 1, 0],
          [0, tempCanvas.height - 1],
          [tempCanvas.width - 1, tempCanvas.height - 1],
        ];

        let totalR = 0, totalG = 0, totalB = 0;
        cornerSamples.forEach(([cx, cy]) => {
          const idx = (cy * tempCanvas.width + cx) * 4;
          totalR += d[idx];
          totalG += d[idx + 1];
          totalB += d[idx + 2];
        });

        const bgR = totalR / cornerSamples.length;
        const bgG = totalG / cornerSamples.length;
        const bgB = totalB / cornerSamples.length;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const dist = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
          );

          if (dist < 40) {
            d[i + 3] = 0; // Transparent
          } else if (dist < 70) {
            d[i + 3] = Math.round(((dist - 40) / 30) * 255); // Smooth feather
          }
        }

        ctx.putImageData(imgData, 0, 0);
        processedBlobUrl = tempCanvas.toDataURL("image/png");
      }

      setAiProgress(100);
      setAiStatusText("Background removed successfully!");

      if (processedBlobUrl) {
        setActiveImageUrl(processedBlobUrl);
        setSuccessMessage("✨ Subject isolated! Background removed cleanly.");
      }
    } catch (err: any) {
      console.error("AI Background Removal error:", err);
      setErrorMessage(
        "Could not remove background automatically. You can continue editing or try another photo."
      );
    } finally {
      setTimeout(() => {
        setIsAiProcessing(false);
        setAiProgress(0);
      }, 500);
    }
  };

  // Add Text Sticker Element
  const handleAddText = () => {
    const newId = `text_${Date.now()}`;
    const newText: TextElement = {
      id: newId,
      text: "COOL STICKER!",
      x: 140,
      y: 220,
      fontSize: 36,
      fill: textColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      rotation: 0,
    };
    setTextElements((prev) => [...prev, newText]);
    setSelectedId(newId);
  };

  const handleUpdateText = (id: string, newAttrs: Partial<TextElement>) => {
    setTextElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...newAttrs } : el))
    );
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    if (selectedId === "main-sticker-image") {
      setActiveImageUrl(null);
      setOriginalImageUrl(null);
      setSelectedId(null);
    } else {
      setTextElements((prev) => prev.filter((el) => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  // Palette Color Selection Handler
  const handleColorSelected = (color: string) => {
    if (colorMode === "fill") {
      setTextColor(color);
      if (selectedId && selectedId !== "main-sticker-image") {
        handleUpdateText(selectedId, { fill: color });
      }
    } else {
      setStrokeColor(color);
      if (selectedId && selectedId !== "main-sticker-image") {
        handleUpdateText(selectedId, { stroke: color });
      }
    }
  };

  // Add Current Canvas to the Pack
  const handleAddStickerToPack = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.exportImage();
    if (dataUrl) {
      if (packStickers.length >= 30) {
        setErrorMessage("WhatsApp sticker packs support up to 30 stickers maximum.");
        return;
      }
      setPackStickers((prev) => [...prev, dataUrl]);
      setSuccessMessage(`Added sticker #${packStickers.length + 1} to pack!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      if (onSaveToPack) {
        onSaveToPack(dataUrl);
      }
    }
  };

  // Single Sticker Direct WebP Export
  const handleExportSingleSticker = async () => {
    if (!canvasRef.current?.stageRef) {
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.exportImage();
        if (dataUrl) {
          const link = document.createElement("a");
          link.download = `sticker-${Date.now()}.webp`;
          link.href = dataUrl;
          link.click();
          setSuccessMessage("🎉 512×512 WebP sticker downloaded!");
        }
      }
      return;
    }

    try {
      const res = await exportStageToWebP(canvasRef.current.stageRef, 0.85);
      if (res) {
        const url = URL.createObjectURL(res.blob);
        const link = document.createElement("a");
        link.download = `sticker-${Date.now()}.webp`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setSuccessMessage("🎉 512×512 WebP sticker exported successfully!");
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Failed to export WebP sticker.");
    }
  };

  const handleRemoveStickerFromPack = (index: number) => {
    setPackStickers((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedTextElement = textElements.find((t) => t.id === selectedId);

  // Active stickers for packaging: either the collected pack or current canvas if pack is empty
  const currentStickersForExport =
    packStickers.length > 0
      ? packStickers
      : activeImageUrl && canvasRef.current?.exportImage()
      ? [canvasRef.current.exportImage()!]
      : [];

  return (
    <div className="w-full flex flex-col gap-6 relative">
      {/* Workspace Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-zinc-300 transition hover:bg-white/15 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">
              Omoji Sticker Studio
            </h2>
            <p className="text-xs text-zinc-400">
              Create and customize WhatsApp stickers with instant cutouts, captions, and easy pack exports
            </p>
          </div>
        </div>

        {/* Global Action Header Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Pack Sidebar Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/15 px-3.5 py-2 text-xs font-bold text-purple-200 transition hover:bg-purple-500/25 active:scale-95 shadow-sm"
          >
            <Package className="h-4 w-4 text-purple-400" />
            <span>My Pack ({packStickers.length}/30)</span>
          </button>

          {activeImageUrl && (
            <button
              type="button"
              onClick={handleExportSingleSticker}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/15 active:scale-95"
            >
              <Download className="h-4 w-4 text-orange-400" />
              <span>Save Sticker</span>
            </button>
          )}

          {/* Finalize Pack CTA */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-green-600/25 transition-transform hover:scale-105 active:scale-95"
          >
            <FolderArchive className="h-4 w-4" />
            <span>Export Pack</span>
          </button>
        </div>
      </div>

      {/* Main Studio Bento Grid Layout */}
      {animatedFile ? (
        <AnimatedPreview
          file={animatedFile}
          onConvertToSticker={handleConvertAnimatedSticker}
          onSkipAndAddDirectly={handleSkipAnimatedConversion}
          onCancel={() => {
            setAnimatedFile(null);
            setIsConvertingAnimated(false);
            setAnimatedProgress(0);
          }}
          isConverting={isConvertingAnimated}
          conversionProgress={animatedProgress}
          conversionStatusText={animatedStatusText}
        />
      ) : !activeImageUrl ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border-2 border-white/15 bg-white/[0.06] p-6 sm:p-10 backdrop-blur-2xl"
        >
          <Uploader
            onImageSelected={handleImageSelected}
            onAnimatedFileSelected={handleAnimatedFileSelected}
            onAssetUrlSelected={handleIngestAssetFromUrl}
          />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Canvas Stage & Floating Overlays (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-white/15 bg-white/[0.06] p-4 sm:p-6 backdrop-blur-2xl lg:col-span-7 overflow-hidden"
          >
            {/* FLOATING EDITOR TOOLBAR OVER CANVAS */}
            <EditorToolbar
              onRemoveBackground={handleRemoveBackground}
              onAddText={handleAddText}
              onResetCanvas={handleResetImage}
              isAiProcessing={isAiProcessing}
              hasImage={!!activeImageUrl}
              selectedColor={colorMode === "fill" ? textColor : strokeColor}
              onSelectColor={handleColorSelected}
              activeColorMode={colorMode}
              onToggleColorMode={() =>
                setColorMode((prev) => (prev === "fill" ? "stroke" : "fill"))
              }
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
            />

            {/* Konva Stage */}
            <div className="mt-14 sm:mt-16 mb-2">
              <CanvasEditor
                ref={canvasRef}
                imageUrl={activeImageUrl}
                originalImageUrl={originalImageUrl}
                textElements={textElements}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onUpdateText={handleUpdateText}
                activeTool={activeTool}
                brushSize={brushSize}
                onImageModified={(newDataUrl) => setActiveImageUrl(newDataUrl)}
              />
            </div>

            {/* Canvas Actions Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                id="add-to-pack-btn"
                type="button"
                onClick={handleAddStickerToPack}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-orange-500/25 transition-transform hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Add to Current Pack ({packStickers.length}/30)
              </button>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageSelected(URL.createObjectURL(f));
                  }}
                />
                <div className="inline-flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15">
                  <ImagePlus className="h-4 w-4 text-zinc-300" />
                  New Image
                </div>
              </label>
            </div>

            <p className="mt-3 text-center text-xs text-zinc-400">
              💡 Drag to move • Use corner handles to scale & rotate • Tap background to deselect
            </p>
          </motion.div>

          {/* Right Column: Tools & Pack Settings Bento Cards (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4 lg:col-span-5"
          >
            {/* AI Background Removal Bento Card */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-white/[0.1] to-white/[0.04] p-5 backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-orange-500/20 blur-xl" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Remove Background</h3>
                    <p className="text-[11px] text-zinc-400">Isolate subjects with 1 tap</p>
                  </div>
                </div>

                <span className="rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                  Auto Magic
                </span>
              </div>

              {/* Progress or Trigger */}
              {isAiProcessing ? (
                <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-orange-500/20 bg-black/40 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-orange-300">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                      {aiStatusText}
                    </span>
                    <span className="text-white">{aiProgress}%</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                      style={{ width: `${aiProgress}%` }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    id="ai-remove-bg-btn"
                    type="button"
                    disabled={isAiProcessing}
                    onClick={handleRemoveBackground}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 text-xs font-extrabold text-zinc-950 shadow-lg shadow-orange-500/20 transition hover:opacity-95 active:scale-95"
                  >
                    <Wand2 className="h-4 w-4" />
                    Remove Photo Background
                  </button>

                  <button
                    type="button"
                    onClick={handleResetImage}
                    title="Reset to original photo"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-zinc-300 transition hover:bg-white/15 hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Smart Erase & Restore Drawing Tools Bento Card */}
            <div className="rounded-3xl border-2 border-white/15 bg-white/[0.08] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                    <Eraser className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Smart Eraser & Restore</h3>
                    <p className="text-[11px] text-zinc-400">Touch up edges or paint back parts</p>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    activeTool === "ERASE"
                      ? "border-rose-500/40 bg-rose-500/20 text-rose-300"
                      : activeTool === "RESTORE"
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                      : "border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                  }`}
                >
                  {activeTool === "ERASE" ? "Erasing" : activeTool === "RESTORE" ? "Restoring" : "Select Mode"}
                </span>
              </div>

              {/* Tool Mode Selector Switch */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-black/40 p-1.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTool("SELECT")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                    activeTool === "SELECT"
                      ? "bg-white/20 text-white shadow-md"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <MousePointer className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Select</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool("ERASE")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                    activeTool === "ERASE"
                      ? "bg-rose-500 text-zinc-950 shadow-[0_0_12px_rgba(244,63,94,0.5)] font-extrabold"
                      : "text-zinc-400 hover:text-rose-300"
                  }`}
                >
                  <Eraser className="h-3.5 w-3.5" />
                  <span>Erase</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool("RESTORE")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                    activeTool === "RESTORE"
                      ? "bg-emerald-500 text-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] font-extrabold"
                      : "text-zinc-400 hover:text-emerald-300"
                  }`}
                >
                  <Paintbrush className="h-3.5 w-3.5" />
                  <span>Restore</span>
                </button>
              </div>

              {/* Brush Size Adjustment */}
              {isDrawingMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/30 p-3.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300">
                      {activeTool === "ERASE" ? "Eraser Thickness" : "Restore Brush Thickness"}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        activeTool === "ERASE" ? "text-rose-300" : "text-emerald-300"
                      }`}
                    >
                      {brushSize}px
                    </span>
                  </div>

                  <input
                    type="range"
                    min={MIN_BRUSH_SIZE}
                    max={MAX_BRUSH_SIZE}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 ${
                      activeTool === "ERASE" ? "accent-rose-500" : "accent-emerald-500"
                    }`}
                  />

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>Precision ({MIN_BRUSH_SIZE}px)</span>
                    <span>Broad ({MAX_BRUSH_SIZE}px)</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sticker Text & Outline Customizer */}
            <div className="rounded-3xl border-2 border-white/15 bg-white/[0.08] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                    <Type className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Sticker Text & Outlines</h3>
                    <p className="text-[11px] text-zinc-400">Bold captions and colored borders</p>
                  </div>
                </div>

                <button
                  id="add-text-btn"
                  type="button"
                  onClick={handleAddText}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-300 transition hover:bg-purple-500/30 active:scale-95"
                >
                  <Type className="h-3.5 w-3.5" />
                  + Add Text
                </button>
              </div>

              {/* Selected Text Controls */}
              {selectedTextElement ? (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">Edit Caption</span>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>

                  <input
                    type="text"
                    value={selectedTextElement.text}
                    onChange={(e) =>
                      handleUpdateText(selectedTextElement.id, { text: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/20 bg-zinc-900 px-3 py-2 text-sm font-extrabold text-white outline-none focus:border-orange-400"
                  />

                  {/* Outline Stroke Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Outline Thickness</span>
                      <span className="font-mono text-white">{selectedTextElement.strokeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={selectedTextElement.strokeWidth}
                      onChange={(e) =>
                        handleUpdateText(selectedTextElement.id, {
                          strokeWidth: Number(e.target.value),
                        })
                      }
                      className="accent-orange-500"
                    />
                  </div>

                  {/* Text Colors */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">Text:</span>
                      <input
                        type="color"
                        value={selectedTextElement.fill}
                        onChange={(e) =>
                          handleUpdateText(selectedTextElement.id, { fill: e.target.value })
                        }
                        className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">Outline:</span>
                      <input
                        type="color"
                        value={selectedTextElement.stroke}
                        onChange={(e) =>
                          handleUpdateText(selectedTextElement.id, { stroke: e.target.value })
                        }
                        className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3 text-center text-xs text-zinc-500">
                  Click "+ Add Text" or tap any text on canvas to change colors & outlines.
                </div>
              )}
            </div>

            {/* Pack Manifest Settings Bento Card */}
            <div className="rounded-3xl border-2 border-white/15 bg-white/[0.08] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Pack Information</h3>
                    <p className="text-[11px] text-zinc-400">Name and author shown in WhatsApp</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                >
                  <PanelRightOpen className="h-3.5 w-3.5" />
                  View All
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400">Pack Name</label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    placeholder="e.g. My Best Memes"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400">Creator Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Your Name"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              {/* Pack Stickers Tray Preview */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
                  <span>Stickers in Pack ({packStickers.length}/30)</span>
                  <span className="text-[10px] text-zinc-500">Preview icon ready</span>
                </div>

                {packStickers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-center text-xs text-zinc-500">
                    No stickers in this pack yet. Click "Add to Current Pack" below canvas to save your work.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                    {packStickers.map((src, idx) => (
                      <div
                        key={idx}
                        className="group/sticker relative aspect-square rounded-xl border border-white/15 bg-black/40 p-1 flex items-center justify-center"
                      >
                        <img
                          src={src}
                          alt={`Sticker ${idx + 1}`}
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStickerFromPack(idx)}
                          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] opacity-0 group-hover/sticker:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                        <span className="absolute bottom-0.5 left-1 text-[9px] font-mono text-zinc-400">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ACTIVE PACK SLIDE-OUT SIDEBAR */}
      <PackSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        packName={packName}
        onPackNameChange={setPackName}
        authorName={authorName}
        onAuthorNameChange={setAuthorName}
        stickers={packStickers}
        onRemoveSticker={handleRemoveStickerFromPack}
        onAddCurrentSticker={handleAddStickerToPack}
        onFinalizePack={() => {
          setIsSidebarOpen(false);
          setIsExportModalOpen(true);
        }}
      />

      {/* WHATSAPP EXPORT MODAL */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        packName={packName}
        authorName={authorName}
        stickers={currentStickersForExport}
        onPublishSuccess={() => {
          setSuccessMessage("🎉 Sticker pack successfully published to cloud & database!");
          setTimeout(() => setSuccessMessage(null), 5000);
        }}
      />

      {/* Asset Ingestion Loading Transition Overlay */}
      <AnimatePresence>
        {isIngestingAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="flex flex-col items-center gap-4 rounded-3xl border-2 border-amber-500/30 bg-zinc-950/95 p-8 text-center shadow-2xl shadow-amber-500/20 max-w-sm w-full"
            >
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 text-zinc-950 shadow-xl shadow-orange-500/30">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                  Ingesting Asset
                </h3>
                <p className="mt-1 text-xs text-amber-300 font-medium">
                  {ingestStatusText}
                </p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  style={{ width: "60%" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/20 p-3.5 text-xs font-medium text-emerald-200"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/20 p-3.5 text-xs font-medium text-rose-200"
          >
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StickerWorkspace;
