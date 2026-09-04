"use client";

import React, { useState, useRef, useCallback } from "react";
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
  RotateCcw,
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
} from "lucide-react";
import { CanvasEditor, CanvasEditorHandle, TextElement } from "./CanvasEditor";
import { removePhotoBackground } from "../../utils/aiBackgroundRemoval";
import { StickerPackRecord } from "../../src/types/pack";
import { StickerDraft } from "../../utils/draftsDb";
import { dataUrlToBlob } from "../../utils/exportSticker";

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

  // UI State
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovalProgress, setBgRemovalProgress] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>("subject-image");
  const [activeTab, setActiveTab] = useState<
    "gallery" | "text" | "emoji" | "background" | null
  >(null);
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

  // Handle Photo Selection: DO NOT AUTO-CUTOUT! User decides explicitly.
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // 1-Tap Direct WebP Download (Offline / Direct Sticker Save)
  const handleDownloadDirectWebp = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.exportImage();
      if (!dataUrl) return;

      const link = document.createElement("a");
      const filename = `whatsapp_sticker_${Date.now()}.webp`;
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Direct WebP download failed:", err);
    }
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

  // Handle Adding Text with Classic Meme Styling
  const handleAddText = () => {
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

  // Handle Removing Selected Element
  const handleDeleteSelectedElement = () => {
    if (!selectedId || selectedId === "subject-image") return;
    setTextElements((prev) => prev.filter((t) => t.id !== selectedId));
    setSelectedId("subject-image");
  };

  // Handle Adding Emoji / Accessory Stamp
  const handleAddEmojiStamp = (emojiChar: string) => {
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

        {/* Slot Info & Quick Stepper if editing a pack slot */}
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

        {/* Quick Transform & Action Tools */}
        <div className="flex items-center gap-1.5">
          {currentDisplayUrl && (
            <div className="flex items-center gap-1 px-1.5 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
              <button
                onClick={() => canvasRef.current?.flipHorizontal()}
                title="Flip Horizontal"
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white/80 hover:text-white transition-all"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => canvasRef.current?.fitAndCenterImage()}
                title="Center & Fit"
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white/80 hover:text-white transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDownloadDirectWebp}
                title="1-Tap Direct WebP Download (512x512)"
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white/80 hover:text-emerald-400 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
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
              {/* Row 1: Text Input + Add Another Text + Delete */}
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

              {/* Row 2: Font Selection & Size Slider */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {MEME_FONTS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => updateSelectedElement({ fontFamily: font.value })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                        (selectedText.fontFamily || "Impact") === font.value
                          ? "bg-blue-600 text-white"
                          : "bg-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      {font.name.split(" ")[0]}
                    </button>
                  ))}
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
                    className="w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Text Fill Color & Outer Stroke Border */}
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

                {/* Stroke Toggle/Width */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-white/60 font-semibold">Outline:</span>
                  <button
                    onClick={() =>
                      updateSelectedElement({
                        strokeWidth: (selectedText.strokeWidth || 0) > 0 ? 0 : 4,
                        stroke: "#000000",
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      (selectedText.strokeWidth || 0) > 0
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {(selectedText.strokeWidth || 0) > 0 ? "ON" : "OFF"}
                  </button>
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

      {/* BOTTOM BAR: 4 Clear Minimalist Actions (Gallery, Text, Emoji, Background) */}
      <div className="relative z-20 bg-[#09090b] border-t border-white/10 pb-6 pt-2 px-6 w-full max-w-lg mx-auto">
        <div className="grid grid-cols-4 items-center justify-items-center">
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

          {/* 4. Background (Cutout vs Original) */}
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
