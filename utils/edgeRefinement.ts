/**
 * Edge Refinement, Magic Brush & Pixel Touch-Up Algorithms for WhatsApp Stickers
 */

export type RefinementBrushMode =
  | "SELECT"
  | "ERASE"
  | "RESTORE"
  | "MAGIC_EDGE"
  | "FEATHER"
  | "COLOR_WAND";

export interface RefinementBrushSettings {
  mode: RefinementBrushMode;
  size: number; // 5 - 120 px
  hardness: number; // 0 - 100% (0 = soft airbrush, 100 = hard edge)
  opacity: number; // 0.1 - 1.0
  tolerance: number; // 5 - 80 (for magic color wand / halo detection)
  ghostOverlayOpacity: number; // 0.0 - 1.0 (reveals original photo for guide)
  zoomLevel: number; // 1, 1.5, 2, 3
}

export const DEFAULT_BRUSH_SETTINGS: RefinementBrushSettings = {
  mode: "SELECT",
  size: 24,
  hardness: 85,
  opacity: 1.0,
  tolerance: 30,
  ghostOverlayOpacity: 0,
  zoomLevel: 1,
};

/**
 * Creates an offscreen canvas containing the image data
 */
export function getCanvasFromSource(
  source: HTMLImageElement | HTMLCanvasElement
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; width: number; height: number } {
  const canvas = document.createElement("canvas");
  const width = source.width || 512;
  const height = source.height || 512;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2d context");

  ctx.drawImage(source, 0, 0, width, height);
  return { canvas, ctx, width, height };
}

/**
 * Auto De-Fringe / Clean Halos:
 * Identifies semi-transparent boundary pixels and checks if their RGB color deviates heavily
 * from inner solid pixels (typical background color contamination/fringe like white or green halos).
 * Re-weights the color to match neighboring opaque pixels and tightens the alpha transition.
 */
export async function autoDeFringeCutout(
  source: HTMLImageElement | HTMLCanvasElement,
  threshold: number = 35
): Promise<string> {
  const { canvas, ctx, width, height } = getCanvasFromSource(source);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const outputData = ctx.createImageData(width, height);
  const out = outputData.data;

  // Copy data
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i];
  }

  // Find edge pixels with partial transparency (10 < alpha < 240)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];

      if (alpha > 0 && alpha < 250) {
        // Sample 8-neighborhood for solid inner color
        let solidR = 0;
        let solidG = 0;
        let solidB = 0;
        let solidCount = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const nAlpha = data[nIdx + 3];
            if (nAlpha >= 250) {
              solidR += data[nIdx];
              solidG += data[nIdx + 1];
              solidB += data[nIdx + 2];
              solidCount++;
            }
          }
        }

        if (solidCount > 0) {
          const avgR = solidR / solidCount;
          const avgG = solidG / solidCount;
          const avgB = solidB / solidCount;

          const curR = data[idx];
          const curG = data[idx + 1];
          const curB = data[idx + 2];

          // Compute color distance to solid core
          const dist = Math.sqrt(
            Math.pow(curR - avgR, 2) + Math.pow(curG - avgG, 2) + Math.pow(curB - avgB, 2)
          );

          if (dist > threshold) {
            // Contaminated halo pixel: replace RGB with solid interior color
            out[idx] = Math.round(avgR);
            out[idx + 1] = Math.round(avgG);
            out[idx + 2] = Math.round(avgB);
            // Tighten alpha
            out[idx + 3] = Math.round(alpha * 0.85);
          }
        }
      }
    }
  }

  ctx.putImageData(outputData, 0, 0);
  return canvas.toDataURL("image/webp");
}

/**
 * Auto-Smooth Edges:
 * Applies morphological anti-aliasing to smooth out jagged pixel staircases on cutout borders.
 */
export async function autoSmoothCutoutEdges(
  source: HTMLImageElement | HTMLCanvasElement
): Promise<string> {
  const { canvas, ctx, width, height } = getCanvasFromSource(source);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const outputData = ctx.createImageData(width, height);
  const out = outputData.data;

  // Copy RGB colors
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i];
  }

  // Smooth alpha channel with a 3x3 Gaussian-like kernel on border pixels
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];

      // If on an edge (between solid and transparent)
      if (alpha > 0 && alpha < 255) {
        let sum = 0;
        let weightSum = 0;

        const weights = [
          [1, 2, 1],
          [2, 4, 2],
          [1, 2, 1],
        ];

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const w = weights[dy + 1][dx + 1];
            sum += data[nIdx + 3] * w;
            weightSum += w;
          }
        }

        const smoothedAlpha = sum / weightSum;
        // Smooth curve interpolation
        out[idx + 3] = Math.round(smoothedAlpha);
      }
    }
  }

  ctx.putImageData(outputData, 0, 0);
  return canvas.toDataURL("image/webp");
}

/**
 * Choke (Erode) Cutout Boundary:
 * Trims the outer perimeter edge inwards by 1-2 pixels to remove stray outlines.
 */
export async function chokeCutoutEdge(
  source: HTMLImageElement | HTMLCanvasElement,
  pixels: number = 1
): Promise<string> {
  const { canvas, ctx, width, height } = getCanvasFromSource(source);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const outputData = ctx.createImageData(width, height);
  const out = outputData.data;

  for (let i = 0; i < data.length; i++) {
    out[i] = data[i];
  }

  const p = Math.max(1, Math.min(4, pixels));

  for (let y = p; y < height - p; y++) {
    for (let x = p; x < width - p; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 0) {
        let minAlpha = 255;
        for (let dy = -p; dy <= p; dy++) {
          for (let dx = -p; dx <= p; dx++) {
            const distSq = dx * dx + dy * dy;
            if (distSq <= p * p) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (data[nIdx + 3] < minAlpha) {
                minAlpha = data[nIdx + 3];
              }
            }
          }
        }
        out[idx + 3] = minAlpha;
      }
    }
  }

  ctx.putImageData(outputData, 0, 0);
  return canvas.toDataURL("image/webp");
}

/**
 * Expand (Dilate) Cutout Boundary:
 * Expands the cutout edge outwards by 1-2 pixels to recover clipped details.
 */
export async function expandCutoutEdge(
  source: HTMLImageElement | HTMLCanvasElement,
  pixels: number = 1
): Promise<string> {
  const { canvas, ctx, width, height } = getCanvasFromSource(source);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const outputData = ctx.createImageData(width, height);
  const out = outputData.data;

  for (let i = 0; i < data.length; i++) {
    out[i] = data[i];
  }

  const p = Math.max(1, Math.min(4, pixels));

  for (let y = p; y < height - p; y++) {
    for (let x = p; x < width - p; x++) {
      const idx = (y * width + x) * 4;
      let maxAlpha = data[idx + 3];
      let nearestColorIdx = idx;

      for (let dy = -p; dy <= p; dy++) {
        for (let dx = -p; dx <= p; dx++) {
          const distSq = dx * dx + dy * dy;
          if (distSq <= p * p) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (data[nIdx + 3] > maxAlpha) {
              maxAlpha = data[nIdx + 3];
              nearestColorIdx = nIdx;
            }
          }
        }
      }

      if (maxAlpha > data[idx + 3]) {
        out[idx] = data[nearestColorIdx];
        out[idx + 1] = data[nearestColorIdx + 1];
        out[idx + 2] = data[nearestColorIdx + 2];
        out[idx + 3] = maxAlpha;
      }
    }
  }

  ctx.putImageData(outputData, 0, 0);
  return canvas.toDataURL("image/webp");
}

/**
 * Magic Color Wand Erase:
 * Removes pixels matching target RGB color within a specified tolerance threshold.
 */
export async function colorToleranceErase(
  source: HTMLImageElement | HTMLCanvasElement,
  targetColor: { r: number; g: number; b: number },
  tolerance: number = 30
): Promise<string> {
  const { canvas, ctx, width, height } = getCanvasFromSource(source);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const tolSq = tolerance * tolerance * 3;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const dr = data[i] - targetColor.r;
      const dg = data[i + 1] - targetColor.g;
      const db = data[i + 2] - targetColor.b;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq <= tolSq) {
        // Soft erase proportional to distance
        const ratio = Math.sqrt(distSq) / (tolerance * 1.732);
        if (ratio < 0.6) {
          data[i + 3] = 0;
        } else {
          data[i + 3] = Math.round(data[i + 3] * ((ratio - 0.6) / 0.4));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/webp");
}
