import { DrawingLine } from "../components/Editor/CanvasEditor";

/**
 * Non-Destructive Layer Compositor
 * Combines the base cutout image, restored original pixels, and erase/magic strokes
 * onto an offscreen canvas without ever overwriting the master photo.
 */
export function compositeNonDestructiveImage(
  baseCutout: HTMLImageElement | HTMLCanvasElement,
  originalPhoto: HTMLImageElement | null,
  lines: DrawingLine[]
): HTMLCanvasElement {
  const width = baseCutout.width || 512;
  const height = baseCutout.height || 512;

  // 1. Output Canvas
  const outCanvas = document.createElement("canvas");
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) return outCanvas;

  // 2. If restore lines exist and original photo is available, composite restored pixels
  const restoreLines = lines.filter((l) => l.tool === "restore");
  const eraseLines = lines.filter(
    (l) => l.tool === "erase" || l.tool === "magic_edge" || l.tool === "feather" || l.tool === "color_wand"
  );

  if (originalPhoto && restoreLines.length > 0) {
    const restoreCanvas = document.createElement("canvas");
    restoreCanvas.width = width;
    restoreCanvas.height = height;
    const rCtx = restoreCanvas.getContext("2d");

    if (rCtx) {
      // Draw full original photo
      rCtx.drawImage(originalPhoto, 0, 0, width, height);

      // Create alpha mask from restore stroke paths
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = width;
      maskCanvas.height = height;
      const mCtx = maskCanvas.getContext("2d");

      if (mCtx) {
        mCtx.lineCap = "round";
        mCtx.lineJoin = "round";

        restoreLines.forEach((line) => {
          if (line.points.length < 2) return;
          mCtx.save();
          mCtx.strokeStyle = "rgba(255, 255, 255, 1.0)";
          mCtx.lineWidth = line.brushSize;
          mCtx.globalAlpha = line.opacity ?? 1.0;

          if (line.hardness && line.hardness < 100) {
            mCtx.shadowBlur = (100 - line.hardness) * 0.15;
            mCtx.shadowColor = "rgba(255, 255, 255, 1.0)";
          }

          mCtx.beginPath();
          mCtx.moveTo(line.points[0], line.points[1]);
          for (let i = 2; i < line.points.length; i += 2) {
            mCtx.lineTo(line.points[i], line.points[i + 1]);
          }
          mCtx.stroke();
          mCtx.restore();
        });

        // Mask original photo to restore strokes
        rCtx.globalCompositeOperation = "destination-in";
        rCtx.drawImage(maskCanvas, 0, 0);
      }

      // Draw restored regions onto base output
      outCtx.drawImage(restoreCanvas, 0, 0);
    }
  }

  // 3. Draw base cutout image on top (source-over)
  outCtx.globalCompositeOperation = "source-over";
  outCtx.drawImage(baseCutout, 0, 0, width, height);

  // 4. If erase/magic/feather lines exist, punch alpha holes cleanly (destination-out)
  if (eraseLines.length > 0) {
    const eraseMaskCanvas = document.createElement("canvas");
    eraseMaskCanvas.width = width;
    eraseMaskCanvas.height = height;
    const eCtx = eraseMaskCanvas.getContext("2d");

    if (eCtx) {
      eCtx.lineCap = "round";
      eCtx.lineJoin = "round";

      eraseLines.forEach((line) => {
        if (line.points.length < 2) return;
        eCtx.save();
        const isFeather = line.tool === "feather";
        const isMagicEdge = line.tool === "magic_edge";
        const opacity = line.opacity ?? (isFeather ? 0.45 : isMagicEdge ? 0.85 : 1.0);
        const blur = line.hardness ? (100 - line.hardness) * 0.2 : isFeather ? 6 : 0;

        eCtx.strokeStyle = "rgba(0, 0, 0, 1.0)";
        eCtx.lineWidth = line.brushSize;
        eCtx.globalAlpha = opacity;

        if (blur > 0) {
          eCtx.shadowBlur = blur;
          eCtx.shadowColor = "rgba(0, 0, 0, 1.0)";
        }

        eCtx.beginPath();
        eCtx.moveTo(line.points[0], line.points[1]);
        for (let i = 2; i < line.points.length; i += 2) {
          eCtx.lineTo(line.points[i], line.points[i + 1]);
        }
        eCtx.stroke();
        eCtx.restore();
      });

      outCtx.globalCompositeOperation = "destination-out";
      outCtx.drawImage(eraseMaskCanvas, 0, 0);
    }
  }

  return outCanvas;
}
