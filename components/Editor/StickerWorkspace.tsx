"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  Image as ImageIcon,
  Type,
  Smile,
  Layers,
  Sparkles,
  Loader2,
  Check,
  Shield,
  RotateCw,
  FlipHorizontal,
  Sliders,
  Palette,
  Trash2,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Package,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoveHorizontal,
  MoveVertical,
  CaseUpper,
  Sun,
  Contrast,
  RotateCcw,
} from "lucide-react";
import { CanvasEditor, CanvasEditorHandle, TextElement, CanvasImageTransform } from "./CanvasEditor";
import { removePhotoBackground } from "../../utils/aiBackgroundRemoval";
import { StickerPackRecord } from "../../src/types/pack";
import { StickerDraft } from "../../utils/draftsDb";
import { dataUrlToBlob } from "../../utils/exportSticker";
import {
  VisualAdjustments,
  DEFAULT_ADJUSTMENTS,
  POP_PRESETS,
  FilterPreset,
  areAdjustmentsDefault,
} from "../../utils/filterEngine";

export interface StickerWorkspaceProps {
  onBack?: () => void;
  onSaveToPack?: (stickerDataUrl: string) => void;
  initialImageUrl?: string | null;
  initialAnimatedFile?: File | null;
  initialDraft?: StickerDraft | null;
  activeSlotInfo?: {
    pack: StickerPackRecord;
    slotIndex: number;
  } | null;
  onCommitSlot?: (
    slotIndex: number,
    dataUrl: string,
    emojis?: string[],
    isAnimated?: boolean
  ) => Promise<void> | void;
  onNavigateSlot?: (slotIndex: number) => void;
  onCommitAndAdvance?: (
    slotIndex: number,
    dataUrl: string,
    emojis?: string[],
    isAnimated?: boolean
  ) => Promise<void> | void;
}

interface HistorySnapshot {
  textElements: TextElement[];
  activeImageMode: "cutout" | "original";
  strokeWidth: number;
  strokeColor: string;
  imageTransform?: CanvasImageTransform;
  adjustments: VisualAdjustments;
}

const MEME_FONTS = [
  { name: "Impact (Meme)", value: "Impact" },
  { name: "Comic Bold", value: "Comic Sans MS, Comic Neue, cursive" },
  { name: "Modern Sans", value: "system-ui, -apple-system, sans-serif" },
  { name: "Heavy Serif", value: "Georgia, serif" },
];

const COLOR_PRESETS = [
  "#ffffff",
  "#000000",
  "#facc15",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

// Curated WhatsApp Emoji & Accessory Stamp Categories
const EMOJI_CATEGORIES = [
  {
    id: "reactions",
    label: "Reactions",
    items: ["😂", "🔥", "😎", "❤️", "✨", "💀", "👀", "💯", "👏", "⚡", "🚀", "🎉", "😍", "🥳", "🥺", "🤯", "🤡", "😴"],
  },
  {
    id: "accessories",
    label: "Props & Stamps",
    items: ["🕶️", "👑", "🧢", "🎩", "⭐", "💫", "💥", "💢", "💎", "🎀", "🎯", "🥇", "🍕", "🍔", "☕", "🍺", "💸", "💰"],
  },
  {
    id: "memes",
    label: "Meme Moods",
    items: ["🐸", "🗿", "🐕", "🐱", "💅", "🤫", "🍿", "👀", "🤦‍♂️", "🤷‍♀️", "🔥", "💀", "🛑", "⚠️", "❌", "✔️", "🆗", "🆒"],
  },
];

export function StickerWorkspace({
  onBack,
  onSaveToPack,
  initialImageUrl,
  activeSlotInfo,
  onCommitSlot,
  onNavigateSlot,
  onCommitAndAdvance,
}: StickerWorkspaceProps) {
  const canvasRef = useRef<CanvasEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Image State (Original vs Cutout)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(
    initialImageUrl || null
  );
  const [cutoutImageUrl, setCutoutImageUrl] = useState<string | null>(null);
  const [activeImageMode, setActiveImageMode] = useState<"cutout" | "original">(
    "original"
  );

  // Outline / Border State (WhatsApp Sticker die-cut)
  const [strokeWidth, setStrokeWidth] = useState<number>(0);
  const [strokeColor, setStrokeColor] = useState<string>("#ffffff");

  // History Engine (Immutable Snapshots for Undo/Redo)
  const [past, setPast] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);

  // UI State
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovalProgress, setBgRemovalProgress] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>("subject-image");
  const [activeTab, setActiveTab] = useState<
    "gallery" | "text" | "emoji" | "adjust" | "background" | null
  >(null);
  const [adjustments, setAdjustments] =
    useState<VisualAdjustments>(DEFAULT_ADJUSTMENTS);
  const [emojiCategory, setEmojiCategory] = useState<string>("reactions");
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associatedEmojis, setAssociatedEmojis] = useState<string[]>(["✨"]);

  // Selected element helpers
  const selectedText = textElements.find((t) => t.id === selectedId);
  const isSelectedEmoji = selectedText && selectedText.id.startsWith("emoji-");

  // Active displayed image URL (cutout or original)
  const currentDisplayUrl =
    activeImageMode === "cutout" && cutoutImageUrl
      ? cutoutImageUrl
      : originalImageUrl;

  // History Engine: Snapshot helper
  const getCurrentSnapshot = useCallback((): HistorySnapshot => {
    return {
      textElements: JSON.parse(JSON.stringify(textElements)),
      activeImageMode,
      strokeWidth,
      strokeColor,
      imageTransform: canvasRef.current?.getImageTransform(),
      adjustments: { ...adjustments },
    };
  }, [textElements, activeImageMode, strokeWidth, strokeColor, adjustments]);

  const pushToHistory = useCallback(
    (snapshotToPush?: HistorySnapshot) => {
      const snap = snapshotToPush || getCurrentSnapshot();
      setPast((prev) => [...prev.slice(-30), snap]);
      setFuture([]);
    },
    [getCurrentSnapshot]
  );

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const currentSnap = getCurrentSnapshot();
    const previousSnap = past[past.length - 1];

    setPast((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [currentSnap, ...prev]);

    setTextElements(previousSnap.textElements);
    setActiveImageMode(previousSnap.activeImageMode);
    setStrokeWidth(previousSnap.strokeWidth);
    setStrokeColor(previousSnap.strokeColor);
    setAdjustments(previousSnap.adjustments || DEFAULT_ADJUSTMENTS);
    if (previousSnap.imageTransform && canvasRef.current) {
      canvasRef.current.setImageTransform(previousSnap.imageTransform);
    }
  }, [past, getCurrentSnapshot]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const currentSnap = getCurrentSnapshot();
    const nextSnap = future[0];

    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, currentSnap]);

    setTextElements(nextSnap.textElements);
    setActiveImageMode(nextSnap.activeImageMode);
    setStrokeWidth(nextSnap.strokeWidth);
    setStrokeColor(nextSnap.strokeColor);
    setAdjustments(nextSnap.adjustments || DEFAULT_ADJUSTMENTS);
    if (nextSnap.imageTransform && canvasRef.current) {
      canvasRef.current.setImageTransform(nextSnap.imageTransform);
    }
  }, [future, getCurrentSnapshot]);

  // Non-Destructive Visual Filters & Adjustments Handlers
  const handleSelectPreset = (preset: FilterPreset) => {
    const newAdj: VisualAdjustments = {
      ...preset.adjustments,
      preset: preset.id,
    };
    setAdjustments(newAdj);
    pushToHistory({ ...getCurrentSnapshot(), adjustments: newAdj });
  };

  const handleUpdateAdjustment = (
    key: "brightness" | "contrast" | "saturation",
    value: number
  ) => {
    setAdjustments((prev) => ({
      ...prev,
      [key]: value,
      preset: undefined, // custom slider changes override active preset name
    }));
  };

  const handleCommitAdjustment = () => {
    pushToHistory({ ...getCurrentSnapshot(), adjustments });
  };

  const handleResetAdjustments = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    pushToHistory({ ...getCurrentSnapshot(), adjustments: DEFAULT_ADJUSTMENTS });
  };

  // Keyboard shortcut listener: Ctrl+Z / Cmd+Z (Undo) and Ctrl+Y / Cmd+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Handle Photo Selection: DO NOT AUTO-CUTOUT! User decides explicitly.
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    pushToHistory();

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setOriginalImageUrl(url);
      setCutoutImageUrl(null);
      setActiveImageMode("original");
      setSelectedId("subject-image");
      setActiveTab("background");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Trigger AI Background Removal (User Clicked Explicitly)
  const triggerAiCutout = async () => {
    if (!originalImageUrl) return;

    try {
      pushToHistory();
      setIsRemovingBg(true);
      setBgRemovalProgress("Segmenting subject...");

      const cutout = await removePhotoBackground(originalImageUrl, (p) => {
        setBgRemovalProgress(p.message || "AI isolating subject...");
      });

      setCutoutImageUrl(cutout);
      setActiveImageMode("cutout");
      setSelectedId("subject-image");
      if (strokeWidth === 0) {
        setStrokeWidth(8);
      }
    } catch (err) {
      console.error("AI cutout failed:", err);
    } finally {
      setIsRemovingBg(false);
      setBgRemovalProgress("");
    }
  };

  // 1-Tap Transform Utilities
  const handleCenterHorizontally = () => {
    canvasRef.current?.centerHorizontally();
  };

  const handleCenterVertically = () => {
    canvasRef.current?.centerVertically();
  };

  const handleFlipHorizontal = () => {
    canvasRef.current?.flipHorizontal();
  };

  const handleRotate90 = () => {
    canvasRef.current?.rotate90("cw");
  };

  // Handle Save (WYSIWYG 512x512 WebP Export to Slot)
  const handleSave = async (advance: boolean = false) => {
    if (!canvasRef.current) return;
    setIsSaving(true);

    try {
      const dataUrl = canvasRef.current.exportImage();
      if (!dataUrl) return;

      const emojisToSave = associatedEmojis.length > 0 ? associatedEmojis : ["✨"];

      if (activeSlotInfo) {
        if (advance && onCommitAndAdvance) {
          await onCommitAndAdvance(activeSlotInfo.slotIndex, dataUrl, emojisToSave, false);
          return;
        } else if (onCommitSlot) {
          await onCommitSlot(activeSlotInfo.slotIndex, dataUrl, emojisToSave, false);
        }
      } else if (onSaveToPack) {
        onSaveToPack(dataUrl);
      }

      onBack?.();
    } catch (err) {
      console.error("Failed to export sticker:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Adding Text with Classic Meme Styling & Shadow
  const handleAddText = () => {
    pushToHistory();
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      text: textElements.filter((t) => !t.id.startsWith("emoji-")).length === 0 ? "TOP TEXT" : "BOTTOM TEXT",
      x: 100,
      y: textElements.filter((t) => !t.id.startsWith("emoji-")).length === 0 ? 50 : 400,
      fontSize: 40,
      fontFamily: "Impact",
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 4,
      align: "center",
      shadowColor: "#000000",
      shadowBlur: 4,
      shadowOffsetY: 2,
    };
    setTextElements((prev) => [...prev, newText]);
    setSelectedId(newText.id);
    setActiveTab("text");
  };

  // Handle Updating Selected Element (Text or Stamp)
  const updateSelectedElement = (attrs: Partial<TextElement>) => {
    if (!selectedId) return;
    setTextElements((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, ...attrs } : t))
    );
  };

  // Toggle ALL CAPS
  const toggleCaps = () => {
    if (!selectedText) return;
    pushToHistory();
    const current = selectedText.text;
    const isUpper = current === current.toUpperCase() && current !== current.toLowerCase();
    const nextText = isUpper ? current.toLowerCase() : current.toUpperCase();
    updateSelectedElement({ text: nextText });
  };

  // Toggle Drop Shadow
  const toggleShadow = () => {
    if (!selectedText) return;
    pushToHistory();
    if (selectedText.shadowColor) {
      updateSelectedElement({ shadowColor: undefined, shadowBlur: 0, shadowOffsetY: 0 });
    } else {
      updateSelectedElement({
        shadowColor: "#000000",
        shadowBlur: 6,
        shadowOffsetY: 3,
      });
    }
  };

  // Handle Removing Selected Element
  const handleDeleteSelectedElement = () => {
    if (!selectedId || selectedId === "subject-image") return;
    pushToHistory();
    setTextElements((prev) => prev.filter((t) => t.id !== selectedId));
    setSelectedId("subject-image");
  };

  // Handle Adding Emoji / Accessory Stamp
  const handleAddEmojiStamp = (emojiChar: string) => {
    pushToHistory();
    const newStamp: TextElement = {
      id: `emoji-${Date.now()}`,
      text: emojiChar,
      x: 230,
      y: 230,
      fontSize: 64,
      fill: "#ffffff",
      stroke: "transparent",
      strokeWidth: 0,
    };
    setTextElements((prev) => [...prev, newStamp]);
    setSelectedId(newStamp.id);

    // Also track for WhatsApp sticker emoji association (up to 3)
    setAssociatedEmojis((prev) => {
      if (prev.includes(emojiChar)) return prev;
      return [emojiChar, ...prev].slice(0, 3);
    });
  };

  return (
    <div
      id="stickerly-full-screen-shell"
      className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between select-none overflow-hidden touch-none"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectFile}
      />

      {/* TOP BAR: Minimalist [X] Cancel, Slot Navigation, Quick Transform & [Save] */}
      <div className="relative z-20 flex items-center justify-between px-3 pt-3 pb-2 w-full max-w-lg mx-auto">
        {/* Close / Back Button */}
        <button
          id="btn-close-canvas"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/10 active:scale-95 flex items-center justify-center text-white backdrop-blur-md transition-transform"
          aria-label="Close Editor"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Middle Area: Slot Info & History Undo / Redo */}
        <div className="flex items-center gap-1.5">
          {activeSlotInfo && (
            <div className="flex items-center gap-1 bg-white/10 border border-white/10 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-md">
              {onNavigateSlot && activeSlotInfo.slotIndex > 0 && (
                <button
                  onClick={() => onNavigateSlot(activeSlotInfo.slotIndex - 1)}
                  className="p-1 hover:text-blue-400 active:scale-90 transition-transform"
                  title="Previous Slot"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-white/90 px-1">Slot #{activeSlotInfo.slotIndex + 1}</span>
              {onNavigateSlot && activeSlotInfo.slotIndex < 29 && (
                <button
                  onClick={() => onNavigateSlot(activeSlotInfo.slotIndex + 1)}
                  className="p-1 hover:text-blue-400 active:scale-90 transition-transform"
                  title="Next Slot"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Immutable History: Undo & Redo buttons */}
          <div className="flex items-center bg-white/10 border border-white/10 rounded-full p-0.5 backdrop-blur-md">
            <button
              onClick={handleUndo}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white/80 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white/80 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Transform & Action Tools */}
        <div className="flex items-center gap-1.5">
          {currentDisplayUrl && (
            <div className="flex items-center gap-1 px-1.5 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
              <button
                onClick={handleCenterHorizontally}
                title="Center Horizontally"
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white/80 hover:text-white transition-all"
              >
                <MoveHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCenterVertically}
                title="Center Vertically"
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white/80 hover:text-white transition-all"
              >
                <MoveVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFlipHorizontal}
                title="Flip Horizontal"
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white/80 hover:text-white transition-all"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRotate90}
                title="Rotate 90°"
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white/80 hover:text-white transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Primary Save Button (Save Slot or Save & Next) */}
          <div className="flex items-center gap-1">
            <button
              id="btn-save-canvas"
              onClick={() => handleSave(false)}
              disabled={isSaving || isRemovingBg || !currentDisplayUrl}
              className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 font-bold text-xs sm:text-sm text-white shadow-lg shadow-blue-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
              <span>Save</span>
            </button>

            {activeSlotInfo && onCommitAndAdvance && activeSlotInfo.slotIndex < 29 && (
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving || isRemovingBg || !currentDisplayUrl}
                title="Save and advance to next slot"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white backdrop-blur-md transition-all disabled:opacity-50"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CENTER: Clean 1:1 Stage Viewport */}
      <div className="relative flex-1 w-full max-w-lg mx-auto flex items-center justify-center p-3">
        {/* If no image loaded yet, prompt to upload */}
        {!currentDisplayUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square max-w-[420px] rounded-3xl border-2 border-dashed border-white/20 bg-white/[0.03] hover:bg-white/[0.06] flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-bold text-base text-white">Choose a Photo</p>
              <p className="text-xs text-white/50 mt-1">
                Tap to pick from gallery or files
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-square max-w-[460px] flex items-center justify-center">
            {/* Konva 512x512 Canvas Component */}
            <CanvasEditor
              ref={canvasRef}
              imageUrl={currentDisplayUrl}
              textElements={textElements}
              selectedId={selectedId}
              onSelect={setSelectedId}
              showSafeZone={showSafeZone}
              strokeWidth={strokeWidth}
              strokeColor={strokeColor}
              adjustments={adjustments}
              onImageTransformEnd={(t) => {
                pushToHistory({ ...getCurrentSnapshot(), imageTransform: t });
              }}
              onEditTextInline={(id) => {
                setSelectedId(id);
                if (id.startsWith("emoji-")) {
                  setActiveTab("emoji");
                } else {
                  setActiveTab("text");
                }
              }}
              onUpdateText={(id, attrs) => {
                setTextElements((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, ...attrs } : t))
                );
              }}
            />

            {/* AI Background Removal Overlay Spinner */}
            {isRemovingBg && (
              <div className="absolute inset-0 z-30 rounded-2xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">
                    AI Isolating Subject
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {bgRemovalProgress || "Analyzing subject edges..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTEXTUAL TOOL DRAWER: Text & Meme Typography */}
      {activeTab === "text" && (
        <div className="z-20 w-full max-w-lg mx-auto px-4 py-3 bg-[#121214] border-t border-white/10 flex flex-col gap-2.5 animate-in slide-in-from-bottom-2">
          {selectedText && !isSelectedEmoji ? (
            <>
              {/* Row 1: Text Input + ALL-CAPS Toggle + Add Another Text + Delete */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedText.text}
                  onChange={(e) => updateSelectedElement({ text: e.target.value })}
                  placeholder="Type sticker text..."
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                  autoFocus
                />
                <button
                  onClick={toggleCaps}
                  title="Toggle ALL-CAPS (Classic Meme)"
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1 ${
                    selectedText.text === selectedText.text.toUpperCase() &&
                    selectedText.text !== selectedText.text.toLowerCase()
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-white/10 text-white/70 border-white/10 hover:text-white"
                  }`}
                >
                  <CaseUpper className="w-3.5 h-3.5" />
                  <span>CAPS</span>
                </button>
                <button
                  onClick={handleAddText}
                  title="Add Another Text"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteSelectedElement}
                  title="Delete Text"
                  className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 active:scale-95 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Row 2: Font Selection + Text Alignment + Size Slider */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {MEME_FONTS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => updateSelectedElement({ fontFamily: font.value })}
                      className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                        (selectedText.fontFamily || "Impact") === font.value
                          ? "bg-blue-600 text-white"
                          : "bg-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      {font.name.split(" ")[0]}
                    </button>
                  ))}
                </div>

                {/* Alignment buttons */}
                <div className="flex items-center bg-white/10 border border-white/10 rounded-lg p-0.5 shrink-0">
                  <button
                    onClick={() => updateSelectedElement({ align: "left" })}
                    title="Align Left"
                    className={`p-1 rounded ${
                      (selectedText.align || "center") === "left"
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateSelectedElement({ align: "center" })}
                    title="Align Center"
                    className={`p-1 rounded ${
                      (selectedText.align || "center") === "center"
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateSelectedElement({ align: "right" })}
                    title="Align Right"
                    className={`p-1 rounded ${
                      (selectedText.align || "center") === "right"
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Size Slider */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-white/60 font-semibold">Size</span>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={selectedText.fontSize}
                    onChange={(e) =>
                      updateSelectedElement({ fontSize: parseInt(e.target.value, 10) })
                    }
                    className="w-16 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Text Fill Color & Drop Shadow Toggle */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                {/* Color Swatches */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-white/60 font-semibold">Color:</span>
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSelectedElement({ fill: c })}
                      className={`w-5 h-5 rounded-full border ${
                        selectedText.fill === c
                          ? "border-blue-400 scale-110 shadow-sm"
                          : "border-white/20"
                      } transition-transform`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Drop Shadow Toggle */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-white/60 font-semibold">Shadow:</span>
                  <button
                    onClick={toggleShadow}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                      selectedText.shadowColor
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {selectedText.shadowColor ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              {/* Row 4: Meme Outline (Stroke) Customization */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[11px] text-white/60 font-semibold shrink-0">
                    Outline ({selectedText.strokeWidth || 0}px):
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={selectedText.strokeWidth ?? 4}
                    onChange={(e) =>
                      updateSelectedElement({
                        strokeWidth: parseInt(e.target.value, 10),
                      })
                    }
                    className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Outline Color Presets */}
                <div className="flex items-center gap-1 shrink-0">
                  {["#000000", "#ffffff", "#facc15", "#ef4444", "#3b82f6"].map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        updateSelectedElement({
                          stroke: c,
                          strokeWidth: (selectedText.strokeWidth || 0) === 0 ? 4 : selectedText.strokeWidth,
                        })
                      }
                      className={`w-4 h-4 rounded-full border ${
                        selectedText.stroke === c && (selectedText.strokeWidth || 0) > 0
                          ? "border-blue-400 scale-110 shadow-sm"
                          : "border-white/20"
                      } transition-transform`}
                      style={{ backgroundColor: c }}
                      title={`Outline ${c}`}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-white/70">No text layer selected</span>
              <button
                onClick={handleAddText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Text</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTEXTUAL TOOL DRAWER: Emoji & Accessory Stamps */}
      {activeTab === "emoji" && (
        <div className="z-20 w-full max-w-lg mx-auto px-4 py-3 bg-[#121214] border-t border-white/10 flex flex-col gap-2.5 animate-in slide-in-from-bottom-2">
          {/* Top Controls: Selected Stamp Controls or Category Selector */}
          <div className="flex items-center justify-between gap-2">
            {isSelectedEmoji && selectedText ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedText.text}</span>
                  <span className="text-xs text-white/70 font-semibold">Stamp Size</span>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    value={selectedText.fontSize}
                    onChange={(e) =>
                      updateSelectedElement({ fontSize: parseInt(e.target.value, 10) })
                    }
                    className="w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <button
                  onClick={handleDeleteSelectedElement}
                  title="Remove Stamp"
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setEmojiCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      emojiCategory === cat.id
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stamps Swatches Grid */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {EMOJI_CATEGORIES.find((c) => c.id === emojiCategory)?.items.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddEmojiStamp(emoji)}
                className="text-2xl p-2 rounded-xl bg-white/5 hover:bg-white/15 active:scale-90 transition-transform shrink-0"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTEXTUAL TOOL DRAWER: Non-Destructive Visual Filters & Pop Presets */}
      {activeTab === "adjust" && currentDisplayUrl && (
        <div className="z-20 w-full max-w-lg mx-auto px-5 py-3.5 bg-[#121214] border-t border-white/10 flex flex-col gap-3.5 animate-in slide-in-from-bottom-2">
          {/* Header Row: Presets Label & 1-Tap Reset */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black tracking-wide text-white uppercase">
                Visual Filters & Pop Presets
              </span>
            </div>

            <button
              onClick={handleResetAdjustments}
              disabled={areAdjustmentsDefault(adjustments)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 text-[11px] font-bold text-white/70 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Row 1: Instant Pop Presets Horizontal Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {POP_PRESETS.map((preset) => {
              const isSelected =
                adjustments.preset === preset.id ||
                (!adjustments.preset &&
                  preset.id === "normal" &&
                  areAdjustmentsDefault(adjustments));
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/20 text-white shadow-sm shadow-blue-500/30"
                      : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  title={preset.description}
                >
                  <span className="text-sm">{preset.emoji}</span>
                  <div className="text-left leading-tight">
                    <div className="flex items-center gap-1">
                      <span>{preset.name}</span>
                      {preset.badge && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-white font-black">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Precision Sliders: Brightness, Contrast, Saturation */}
          <div className="grid grid-cols-1 gap-2.5 pt-1 border-t border-white/5">
            {/* Brightness Slider */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-24 shrink-0">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold text-white/80">Brightness</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={adjustments.brightness}
                onChange={(e) =>
                  handleUpdateAdjustment("brightness", parseInt(e.target.value, 10))
                }
                onPointerUp={handleCommitAdjustment}
                onTouchEnd={handleCommitAdjustment}
                className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <button
                onClick={() => {
                  handleUpdateAdjustment("brightness", 0);
                  handleCommitAdjustment();
                }}
                className={`w-9 text-right font-mono text-[11px] font-bold ${
                  adjustments.brightness !== 0 ? "text-amber-300" : "text-white/40"
                }`}
                title="Click to reset Brightness to 0"
              >
                {adjustments.brightness > 0
                  ? `+${adjustments.brightness}`
                  : adjustments.brightness}
              </button>
            </div>

            {/* Contrast Slider */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-24 shrink-0">
                <Contrast className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] font-bold text-white/80">Contrast</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={adjustments.contrast}
                onChange={(e) =>
                  handleUpdateAdjustment("contrast", parseInt(e.target.value, 10))
                }
                onPointerUp={handleCommitAdjustment}
                onTouchEnd={handleCommitAdjustment}
                className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <button
                onClick={() => {
                  handleUpdateAdjustment("contrast", 0);
                  handleCommitAdjustment();
                }}
                className={`w-9 text-right font-mono text-[11px] font-bold ${
                  adjustments.contrast !== 0 ? "text-purple-300" : "text-white/40"
                }`}
                title="Click to reset Contrast to 0"
              >
                {adjustments.contrast > 0
                  ? `+${adjustments.contrast}`
                  : adjustments.contrast}
              </button>
            </div>

            {/* Saturation Slider */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-24 shrink-0">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-white/80">Saturation</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={adjustments.saturation}
                onChange={(e) =>
                  handleUpdateAdjustment("saturation", parseInt(e.target.value, 10))
                }
                onPointerUp={handleCommitAdjustment}
                onTouchEnd={handleCommitAdjustment}
                className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <button
                onClick={() => {
                  handleUpdateAdjustment("saturation", 0);
                  handleCommitAdjustment();
                }}
                className={`w-9 text-right font-mono text-[11px] font-bold ${
                  adjustments.saturation !== 0 ? "text-emerald-300" : "text-white/40"
                }`}
                title="Click to reset Saturation to 0"
              >
                {adjustments.saturation > 0
                  ? `+${adjustments.saturation}`
                  : adjustments.saturation}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEXTUAL TOOL DRAWER: Background & Cutout Studio */}
      {activeTab === "background" && currentDisplayUrl && (
        <div className="z-20 w-full max-w-lg mx-auto px-5 py-3.5 bg-[#121214] border-t border-white/10 flex flex-col gap-3 animate-in slide-in-from-bottom-2">
          {/* Row 1: AI Cutout Button vs Original Toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                id="btn-mode-cutout"
                onClick={() => {
                  if (cutoutImageUrl) {
                    setActiveImageMode("cutout");
                  } else {
                    triggerAiCutout();
                  }
                }}
                disabled={isRemovingBg}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeImageMode === "cutout"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{cutoutImageUrl ? "Cutout" : "AI Cutout"}</span>
              </button>

              <button
                id="btn-mode-original"
                onClick={() => setActiveImageMode("original")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeImageMode === "original"
                    ? "bg-white/20 text-white font-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Original
              </button>
            </div>

            {/* Re-Cutout Button if already processed */}
            {cutoutImageUrl && (
              <button
                onClick={triggerAiCutout}
                disabled={isRemovingBg}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold active:scale-95 transition-transform"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-run AI</span>
              </button>
            )}
          </div>

          {/* Row 2: Sticker Outline (Die-Cut Border) Slider & Swatches */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] font-bold text-white/70 shrink-0">
              Border ({strokeWidth}px)
            </span>
            <input
              type="range"
              min="0"
              max="24"
              step="2"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            {/* Outline Color Presets */}
            <div className="flex items-center gap-1 shrink-0">
              {["#ffffff", "#000000", "#3b82f6", "#22c55e", "#ef4444", "#eab308"].map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setStrokeColor(c);
                      if (strokeWidth === 0) setStrokeWidth(8);
                    }}
                    className={`w-5 h-5 rounded-full border ${
                      strokeColor === c && strokeWidth > 0
                        ? "border-blue-400 scale-110 shadow-sm"
                        : "border-white/20"
                    } transition-transform`}
                    style={{ backgroundColor: c }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM BAR: 5 Clear Minimalist Actions (Gallery, Text, Emoji, Adjust, Background) */}
      <div className="relative z-20 bg-[#09090b] border-t border-white/10 pb-6 pt-2 px-4 w-full max-w-lg mx-auto">
        <div className="grid grid-cols-5 items-center justify-items-center">
          {/* 1. Gallery */}
          <button
            id="tab-gallery"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="flex flex-col items-center gap-1 py-1 text-white/70 hover:text-white active:scale-95 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
              <ImageIcon className="w-6 h-6 stroke-[1.75]" />
            </div>
            <span className="text-[11px] font-medium">Gallery</span>
          </button>

          {/* 2. Text */}
          <button
            id="tab-text"
            onClick={() => {
              if (textElements.filter((t) => !t.id.startsWith("emoji-")).length === 0) {
                handleAddText();
              } else {
                setActiveTab((prev) => (prev === "text" ? null : "text"));
                const firstText = textElements.find((t) => !t.id.startsWith("emoji-"));
                if (firstText) {
                  setSelectedId(firstText.id);
                }
              }
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors active:scale-95 ${
              activeTab === "text"
                ? "text-blue-400"
                : "text-white/70 hover:text-white"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
              <Type className="w-6 h-6 stroke-[1.75]" />
            </div>
            <span className="text-[11px] font-medium">Text</span>
          </button>

          {/* 3. Emoji & Stamps */}
          <button
            id="tab-emoji"
            onClick={() => {
              setActiveTab((prev) => (prev === "emoji" ? null : "emoji"));
              const firstEmoji = textElements.find((t) => t.id.startsWith("emoji-"));
              if (firstEmoji) {
                setSelectedId(firstEmoji.id);
              }
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors active:scale-95 ${
              activeTab === "emoji"
                ? "text-blue-400"
                : "text-white/70 hover:text-white"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
              <Smile className="w-6 h-6 stroke-[1.75]" />
            </div>
            <span className="text-[11px] font-medium">Emoji</span>
          </button>

          {/* 4. Filters & Pop Presets */}
          <button
            id="tab-adjust"
            onClick={() => {
              setActiveTab((prev) => (prev === "adjust" ? null : "adjust"));
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors active:scale-95 ${
              activeTab === "adjust"
                ? "text-blue-400"
                : "text-white/70 hover:text-white"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
              <Sliders className="w-6 h-6 stroke-[1.75]" />
            </div>
            <span className="text-[11px] font-medium">Adjust</span>
          </button>

          {/* 5. Background (Cutout vs Original) */}
          <button
            id="tab-background"
            onClick={() => {
              setActiveTab((prev) =>
                prev === "background" ? null : "background"
              );
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors active:scale-95 ${
              activeTab === "background"
                ? "text-blue-400"
                : "text-white/70 hover:text-white"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
              <Layers className="w-6 h-6 stroke-[1.75]" />
            </div>
            <span className="text-[11px] font-medium">Background</span>
          </button>
        </div>
      </div>
    </div>
  );
}
