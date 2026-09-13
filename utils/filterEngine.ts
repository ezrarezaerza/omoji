/**
 * Non-Destructive Visual Filters & Adjustments Engine
 * Supports Brightness, Contrast, Saturation & Instant Pop Presets for WhatsApp Stickers
 */

export interface VisualAdjustments {
  brightness: number; // -100 to 100, default 0
  contrast: number;   // -100 to 100, default 0
  saturation: number; // -100 to 100, default 0
  preset?: string;    // Active preset identifier
}

export const DEFAULT_ADJUSTMENTS: VisualAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  preset: "normal",
};

export interface FilterPreset {
  id: string;
  name: string;
  badge?: string;
  description: string;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  accentColor: string;
  emoji: string;
}

export const POP_PRESETS: FilterPreset[] = [
  {
    id: "normal",
    name: "Original",
    description: "Untouched, natural photo colors",
    adjustments: { brightness: 0, contrast: 0, saturation: 0 },
    accentColor: "border-white/20 text-white/90 bg-white/5",
    emoji: "📷",
  },
  {
    id: "pop",
    name: "Sticker Pop",
    badge: "POP",
    description: "Punchy, crisp contrast made for WhatsApp chats",
    adjustments: { brightness: 8, contrast: 28, saturation: 40 },
    accentColor: "border-blue-500 text-blue-400 bg-blue-500/15",
    emoji: "✨",
  },
  {
    id: "vivid",
    name: "Vivid Glow",
    badge: "VIVID",
    description: "Rich hyper-saturated colors with lively tones",
    adjustments: { brightness: 6, contrast: 18, saturation: 58 },
    accentColor: "border-emerald-500 text-emerald-400 bg-emerald-500/15",
    emoji: "🌈",
  },
  {
    id: "dramatic",
    name: "Dramatic",
    badge: "DEEP",
    description: "Deep moody shadows with high dynamic punch",
    adjustments: { brightness: -8, contrast: 42, saturation: 15 },
    accentColor: "border-purple-500 text-purple-400 bg-purple-500/15",
    emoji: "🎭",
  },
  {
    id: "warm",
    name: "Warm Sun",
    badge: "WARM",
    description: "Golden hour glow with cozy amber tones",
    adjustments: { brightness: 8, contrast: 14, saturation: 30 },
    accentColor: "border-amber-500 text-amber-400 bg-amber-500/15",
    emoji: "☀️",
  },
  {
    id: "cool",
    name: "Cool Frost",
    badge: "COOL",
    description: "Crisp icy temperature with cinematic cool hues",
    adjustments: { brightness: 6, contrast: 20, saturation: -10 },
    accentColor: "border-cyan-500 text-cyan-400 bg-cyan-500/15",
    emoji: "❄️",
  },
  {
    id: "meme",
    name: "Meme Fry",
    badge: "🔥 MEME",
    description: "Over-the-top spicy contrast for classic meme stickers",
    adjustments: { brightness: 18, contrast: 70, saturation: 75 },
    accentColor: "border-red-500 text-red-400 bg-red-500/15",
    emoji: "🔥",
  },
  {
    id: "mono",
    name: "B&W Mono",
    badge: "B&W",
    description: "High-contrast clean classic monochrome",
    adjustments: { brightness: 4, contrast: 34, saturation: -100 },
    accentColor: "border-neutral-400 text-neutral-200 bg-white/10",
    emoji: "🖤",
  },
  {
    id: "vintage",
    name: "Retro Soft",
    badge: "RETRO",
    description: "Faded nostalgic film matte with soft highlights",
    adjustments: { brightness: 8, contrast: -14, saturation: -22 },
    accentColor: "border-rose-400 text-rose-300 bg-rose-500/15",
    emoji: "📼",
  },
];

export function areAdjustmentsDefault(adj?: VisualAdjustments | null): boolean {
  if (!adj) return true;
  return adj.brightness === 0 && adj.contrast === 0 && adj.saturation === 0;
}

/**
 * Applies non-destructive hardware-accelerated filters to a canvas or image source
 */
export function applyVisualFilters(
  source: CanvasImageSource,
  width: number,
  height: number,
  adjustments: VisualAdjustments
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) return canvas;

  if (areAdjustmentsDefault(adjustments)) {
    ctx.drawImage(source, 0, 0, width, height);
    return canvas;
  }

  // Convert -100 to 100 slider values into percentage multipliers
  // 0 -> 100%, -100 -> 0%, +100 -> 200%
  const b = Math.max(0, 100 + adjustments.brightness);
  const c = Math.max(0, 100 + adjustments.contrast);
  const s = Math.max(0, 100 + adjustments.saturation);

  ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
  ctx.drawImage(source, 0, 0, width, height);
  ctx.filter = "none";

  return canvas;
}
