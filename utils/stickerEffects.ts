/**
 * Die-Cut White Outline & Shadow Generation Engine for WhatsApp Stickers
 */

export interface StickerOutlineConfig {
  enabled: boolean;
  width: number; // 2 - 24 px
  color: string; // e.g. '#ffffff'
  shadowEnabled: boolean;
  shadowBlur: number; // 0 - 25
  shadowColor: string; // e.g. 'rgba(0, 0, 0, 0.45)'
  shadowOffsetY: number;
}

export const DEFAULT_OUTLINE_CONFIG: StickerOutlineConfig = {
  enabled: false,
  width: 10,
  color: "#ffffff",
  shadowEnabled: true,
  shadowBlur: 10,
  shadowColor: "rgba(0, 0, 0, 0.45)",
  shadowOffsetY: 4,
};

export const OUTLINE_PRESETS = [
  {
    id: "classic-white",
    name: "Classic Die-Cut",
    config: {
      enabled: true,
      width: 10,
      color: "#ffffff",
      shadowEnabled: true,
      shadowBlur: 10,
      shadowColor: "rgba(0, 0, 0, 0.45)",
      shadowOffsetY: 4,
    },
  },
  {
    id: "bold-cutout",
    name: "Bold Cutout",
    config: {
      enabled: true,
      width: 16,
      color: "#ffffff",
      shadowEnabled: true,
      shadowBlur: 14,
      shadowColor: "rgba(0, 0, 0, 0.55)",
      shadowOffsetY: 6,
    },
  },
  {
    id: "neon-cyan",
    name: "Cyber Cyan",
    config: {
      enabled: true,
      width: 10,
      color: "#06b6d4",
      shadowEnabled: true,
      shadowBlur: 16,
      shadowColor: "rgba(6, 182, 212, 0.6)",
      shadowOffsetY: 0,
    },
  },
  {
    id: "pop-yellow",
    name: "Pop Yellow",
    config: {
      enabled: true,
      width: 12,
      color: "#facc15",
      shadowEnabled: true,
      shadowBlur: 10,
      shadowColor: "rgba(0, 0, 0, 0.4)",
      shadowOffsetY: 4,
    },
  },
  {
    id: "hot-pink",
    name: "Neon Pink",
    config: {
      enabled: true,
      width: 10,
      color: "#ec4899",
      shadowEnabled: true,
      shadowBlur: 16,
      shadowColor: "rgba(236, 72, 153, 0.6)",
      shadowOffsetY: 0,
    },
  },
  {
    id: "none",
    name: "No Outline",
    config: {
      enabled: false,
      width: 0,
      color: "#ffffff",
      shadowEnabled: false,
      shadowBlur: 0,
      shadowColor: "transparent",
      shadowOffsetY: 0,
    },
  },
];

/**
 * Generates an offscreen Canvas with the dilated die-cut outline and shadow of an image
 */
export function generateDieCutOutlineCanvas(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  config: StickerOutlineConfig
): HTMLCanvasElement | null {
  if (!config.enabled || config.width <= 0) {
    return null;
  }

  const width = sourceImage.width;
  const height = sourceImage.height;
  if (!width || !height) return null;

  const outlineCanvas = document.createElement("canvas");
  outlineCanvas.width = width;
  outlineCanvas.height = height;

  const ctx = outlineCanvas.getContext("2d");
  if (!ctx) return null;

  const strokeRadius = Math.max(1, Math.min(40, config.width));

  // Step 1: Create a single solid silhouette on an intermediate canvas
  const silhouetteCanvas = document.createElement("canvas");
  silhouetteCanvas.width = width;
  silhouetteCanvas.height = height;
  const sCtx = silhouetteCanvas.getContext("2d");
  if (!sCtx) return null;

  sCtx.drawImage(sourceImage, 0, 0);
  sCtx.globalCompositeOperation = "source-in";
  sCtx.fillStyle = config.color;
  sCtx.fillRect(0, 0, width, height);

  // Step 2: Radial stamp dilation across 360 degrees for smooth outer contour
  // We use 2 concentric rings if strokeRadius is larger than 6 for seamless fill
  const rings = strokeRadius > 8 ? [strokeRadius * 0.5, strokeRadius] : [strokeRadius];
  const stepsPerRing = 16;

  // Apply drop shadow if enabled
  if (config.shadowEnabled && config.shadowBlur > 0) {
    ctx.shadowColor = config.shadowColor;
    ctx.shadowBlur = config.shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = config.shadowOffsetY;
  }

  rings.forEach((r) => {
    for (let i = 0; i < stepsPerRing; i++) {
      const angle = (i * 2 * Math.PI) / stepsPerRing;
      const dx = Math.cos(angle) * r;
      const dy = Math.sin(angle) * r;
      ctx.drawImage(silhouetteCanvas, dx, dy);
    }
  });

  // Step 3: Radial dilation generates the outer expanded border
  // Punch out the original inner silhouette so the outline canvas is purely the outer border & shadow
  // This guarantees that transparent cutouts & manual erasures never show solid white backing
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.drawImage(silhouetteCanvas, 0, 0);
  ctx.restore();

  return outlineCanvas;
}
