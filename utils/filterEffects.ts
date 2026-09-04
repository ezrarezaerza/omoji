/**
 * Visual Filters & Comic Styling Effects Engine for WhatsApp Stickers
 */

export type ComicEffectType = "none" | "speed-lines" | "starburst" | "comic-dots" | "halftone";

export interface StickerFilterConfig {
  preset: string;
  brightness: number; // -100 to 100 (default 0)
  contrast: number; // -100 to 100 (default 0)
  saturation: number; // -100 to 100 (default 0)
  hue: number; // 0 to 360 (default 0)
  posterizeLevels: number; // 0 (off) or 2 to 16
  pixelSize: number; // 0 (off) or 2 to 24
  comicEffect: ComicEffectType;
  comicEffectColor: string; // default '#facc15'
  comicEffectOpacity: number; // 0 to 1 (default 0.7)
}

export const DEFAULT_FILTER_CONFIG: StickerFilterConfig = {
  preset: "none",
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  posterizeLevels: 0,
  pixelSize: 0,
  comicEffect: "none",
  comicEffectColor: "#facc15",
  comicEffectOpacity: 0.75,
};

export interface FilterPreset {
  id: string;
  name: string;
  category: "Classic" | "Comic" | "Retro" | "Artistic";
  description: string;
  badge: string;
  config: Partial<StickerFilterConfig>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "none",
    name: "Original",
    category: "Classic",
    description: "Standard vibrant cutout without color grading",
    badge: "✦",
    config: {
      preset: "none",
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      posterizeLevels: 0,
      pixelSize: 0,
    },
  },
  {
    id: "pop-art",
    name: "Pop-Art Boost",
    category: "Artistic",
    description: "Saturated neon colors with punchy dark outlines",
    badge: "🎨",
    config: {
      preset: "pop-art",
      brightness: 5,
      contrast: 45,
      saturation: 65,
      hue: 0,
      posterizeLevels: 0,
      pixelSize: 0,
    },
  },
  {
    id: "vintage-comic",
    name: "Vintage Comic",
    category: "Comic",
    description: "Classic newsprint ink tone with deep shadows",
    badge: "💥",
    config: {
      preset: "vintage-comic",
      brightness: 0,
      contrast: 50,
      saturation: 35,
      hue: 0,
      posterizeLevels: 6,
      pixelSize: 0,
      comicEffect: "comic-dots",
      comicEffectColor: "#facc15",
      comicEffectOpacity: 0.6,
    },
  },
  {
    id: "action-hero",
    name: "Action Speed",
    category: "Comic",
    description: "Dramatic comic speed burst lines radiating outward",
    badge: "⚡",
    config: {
      preset: "action-hero",
      brightness: 5,
      contrast: 40,
      saturation: 40,
      hue: 0,
      comicEffect: "speed-lines",
      comicEffectColor: "#ffffff",
      comicEffectOpacity: 0.8,
    },
  },
  {
    id: "posterize-cartoon",
    name: "Cartoon Cel-Shaded",
    category: "Artistic",
    description: "4-level color flattening for an animated cartoon look",
    badge: "📺",
    config: {
      preset: "posterize-cartoon",
      brightness: 5,
      contrast: 35,
      saturation: 40,
      hue: 0,
      posterizeLevels: 4,
      pixelSize: 0,
    },
  },
  {
    id: "noir-contrast",
    name: "Noir B&W",
    category: "Classic",
    description: "High-contrast dramatic black and white manga aesthetic",
    badge: "🕶️",
    config: {
      preset: "noir-contrast",
      brightness: -5,
      contrast: 65,
      saturation: -100,
      hue: 0,
      posterizeLevels: 0,
      pixelSize: 0,
    },
  },
  {
    id: "cyberpunk",
    name: "Cyber Neon",
    category: "Artistic",
    description: "Electric magenta and cyan futuristic tinting",
    badge: "🔮",
    config: {
      preset: "cyberpunk",
      brightness: 10,
      contrast: 50,
      saturation: 75,
      hue: 290,
      posterizeLevels: 0,
      pixelSize: 0,
    },
  },
  {
    id: "pixel-8bit",
    name: "8-Bit Pixel Art",
    category: "Retro",
    description: "Chunky retro gaming pixelated sprite effect",
    badge: "👾",
    config: {
      preset: "pixel-8bit",
      brightness: 5,
      contrast: 30,
      saturation: 25,
      hue: 0,
      posterizeLevels: 6,
      pixelSize: 8,
    },
  },
  {
    id: "sepia-retro",
    name: "Retro Warmth",
    category: "Retro",
    description: "Nostalgic golden-hour warm sepia tone",
    badge: "☕",
    config: {
      preset: "sepia-retro",
      brightness: -5,
      contrast: 20,
      saturation: -25,
      hue: 35,
      posterizeLevels: 0,
      pixelSize: 0,
    },
  },
];

/**
 * Applies visual filters (brightness, contrast, saturation, hue, posterize, pixelate)
 * to a source image on an offscreen canvas.
 */
export function applyImageFilters(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  config: StickerFilterConfig
): HTMLCanvasElement | null {
  const width = sourceImage.width;
  const height = sourceImage.height;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  // If all filter settings are neutral, just draw the image clean
  const isNeutral =
    config.brightness === 0 &&
    config.contrast === 0 &&
    config.saturation === 0 &&
    config.hue === 0 &&
    (!config.posterizeLevels || config.posterizeLevels <= 0) &&
    (!config.pixelSize || config.pixelSize <= 0);

  if (isNeutral) {
    ctx.drawImage(sourceImage, 0, 0, width, height);
    return canvas;
  }

  // Handle Pixelate first if enabled
  if (config.pixelSize && config.pixelSize > 1) {
    const pSize = Math.max(2, Math.min(32, config.pixelSize));
    const smallCanvas = document.createElement("canvas");
    const sw = Math.max(1, Math.floor(width / pSize));
    const sh = Math.max(1, Math.floor(height / pSize));
    smallCanvas.width = sw;
    smallCanvas.height = sh;
    const sCtx = smallCanvas.getContext("2d");
    if (sCtx) {
      sCtx.imageSmoothingEnabled = false;
      sCtx.drawImage(sourceImage, 0, 0, sw, sh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(smallCanvas, 0, 0, sw, sh, 0, 0, width, height);
    } else {
      ctx.drawImage(sourceImage, 0, 0, width, height);
    }
  } else {
    ctx.drawImage(sourceImage, 0, 0, width, height);
  }

  // Pixel data manipulation
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  // Pre-calculate contrast factor
  const contrastFactor =
    config.contrast !== 0
      ? (259 * (config.contrast + 255)) / (255 * (259 - config.contrast))
      : 1;

  const brightnessOffset = (config.brightness / 100) * 255;
  const satFactor = (config.saturation + 100) / 100;
  const posterizeLevels = config.posterizeLevels > 1 ? config.posterizeLevels : 0;
  const posterizeStep = posterizeLevels > 1 ? 255 / (posterizeLevels - 1) : 0;
  const hueShift = config.hue ? (config.hue % 360) * (Math.PI / 180) : 0;

  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue; // Skip completely transparent pixels

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Contrast & Brightness
    if (config.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }
    if (config.brightness !== 0) {
      r += brightnessOffset;
      g += brightnessOffset;
      b += brightnessOffset;
    }

    // 2. Saturation
    if (config.saturation !== 0) {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    // 3. Hue Shift (simplified RGB matrix approximation)
    if (hueShift !== 0) {
      const cosA = Math.cos(hueShift);
      const sinA = Math.sin(hueShift);
      const nr = r * (0.299 + 0.701 * cosA + 0.168 * sinA) +
                 g * (0.587 - 0.587 * cosA + 0.330 * sinA) +
                 b * (0.114 - 0.114 * cosA - 0.497 * sinA);
      const ng = r * (0.299 - 0.299 * cosA - 0.328 * sinA) +
                 g * (0.587 + 0.413 * cosA + 0.035 * sinA) +
                 b * (0.114 - 0.114 * cosA + 0.288 * sinA);
      const nb = r * (0.299 - 0.300 * cosA + 1.250 * sinA) +
                 g * (0.587 - 0.588 * cosA - 1.050 * sinA) +
                 b * (0.114 + 0.886 * cosA - 0.203 * sinA);
      r = nr;
      g = ng;
      b = nb;
    }

    // 4. Posterize
    if (posterizeLevels > 1) {
      r = Math.round(r / posterizeStep) * posterizeStep;
      g = Math.round(g / posterizeStep) * posterizeStep;
      b = Math.round(b / posterizeStep) * posterizeStep;
    }

    // Clamp values
    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Generates an offscreen Canvas containing comic visual effects
 * (e.g. Manga Speed Lines, Comic Action Starburst, Halftone Ben-Day Dots)
 */
export function generateComicEffectCanvas(
  width: number = 512,
  height: number = 512,
  type: ComicEffectType,
  color: string = "#facc15",
  opacity: number = 0.7
): HTMLCanvasElement | null {
  if (type === "none") return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, width, height);
  ctx.globalAlpha = Math.max(0.1, Math.min(1, opacity));

  const centerX = width / 2;
  const centerY = height / 2;

  if (type === "speed-lines") {
    // Dramatic radial comic speed / action rays from outer edge toward center
    const numRays = 48;
    const maxRadius = Math.sqrt(width * width + height * height) * 0.6;
    const innerRadius = Math.min(width, height) * 0.28;

    ctx.fillStyle = color;
    for (let i = 0; i < numRays; i++) {
      const angle = (i * 2 * Math.PI) / numRays + (i % 3) * 0.02;
      const rayWidthAngle = (0.015 + ((i % 5) * 0.008));
      
      const rInner = innerRadius + ((i % 4) * 15);
      const rOuter = maxRadius;

      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle - rayWidthAngle) * rOuter,
        centerY + Math.sin(angle - rayWidthAngle) * rOuter
      );
      ctx.lineTo(
        centerX + Math.cos(angle + rayWidthAngle) * rOuter,
        centerY + Math.sin(angle + rayWidthAngle) * rOuter
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * rInner,
        centerY + Math.sin(angle) * rInner
      );
      ctx.closePath();
      ctx.fill();
    }
  } else if (type === "starburst") {
    // Dynamic comic explosion / BOOM starburst
    const numPoints = 16;
    const outerR = Math.min(width, height) * 0.44;
    const innerR = Math.min(width, height) * 0.26;

    ctx.fillStyle = color;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.lineJoin = "miter";

    ctx.beginPath();
    for (let i = 0; i < numPoints * 2; i++) {
      const angle = (i * Math.PI) / numPoints;
      // alternate between inner and outer radius with randomized variation
      const r = i % 2 === 0 ? outerR * (0.9 + (i % 3) * 0.08) : innerR * (0.85 + (i % 4) * 0.06);
      const px = centerX + Math.cos(angle) * r;
      const py = centerY + Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === "comic-dots" || type === "halftone") {
    // Pop-Art Ben-Day dot matrix pattern
    const dotSpacing = 16;
    const dotRadius = type === "halftone" ? 3.5 : 4;
    ctx.fillStyle = color;

    for (let x = 8; x < width; x += dotSpacing) {
      for (let y = 8; y < height; y += dotSpacing) {
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        // Vignetted dot size: larger towards edges
        const radius = type === "halftone" 
          ? Math.min(6, Math.max(1.5, (distFromCenter / (width * 0.5)) * dotRadius))
          : dotRadius;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return canvas;
}
