/**
 * Visual Layer Management & Hierarchy Engine for Sticker Canvas
 */

import { TextElement } from "../components/Editor/CanvasEditor";

export type LayerType = "image" | "text" | "comic-bg";

export interface CanvasLayerItem {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  flipX: boolean;
  flipY: boolean;
}

export const MAIN_IMAGE_LAYER_ID = "main-sticker-group";
export const COMIC_BG_LAYER_ID = "comic-bg-layer";

/**
 * Derives the active list of visual canvas layers from current text elements,
 * image availability, and background effects.
 */
export function buildCanvasLayerList(
  hasImage: boolean,
  hasComicEffect: boolean,
  textElements: TextElement[],
  layerStates: Record<string, Partial<CanvasLayerItem>>,
  customLayerOrder: string[]
): CanvasLayerItem[] {
  const defaultLayers: CanvasLayerItem[] = [];

  if (hasComicEffect) {
    const s = layerStates[COMIC_BG_LAYER_ID] || {};
    defaultLayers.push({
      id: COMIC_BG_LAYER_ID,
      name: "Comic Action FX",
      type: "comic-bg",
      visible: s.visible ?? true,
      locked: s.locked ?? false,
      opacity: s.opacity ?? 1,
      flipX: s.flipX ?? false,
      flipY: s.flipY ?? false,
    });
  }

  if (hasImage) {
    const s = layerStates[MAIN_IMAGE_LAYER_ID] || {};
    defaultLayers.push({
      id: MAIN_IMAGE_LAYER_ID,
      name: "Sticker Subject Cutout",
      type: "image",
      visible: s.visible ?? true,
      locked: s.locked ?? false,
      opacity: s.opacity ?? 1,
      flipX: s.flipX ?? false,
      flipY: s.flipY ?? false,
    });
  }

  textElements.forEach((txt, idx) => {
    const s = layerStates[txt.id] || {};
    defaultLayers.push({
      id: txt.id,
      name: `Text: "${txt.text.length > 16 ? txt.text.slice(0, 14) + "…" : txt.text}"`,
      type: "text",
      visible: s.visible ?? true,
      locked: s.locked ?? false,
      opacity: s.opacity ?? 1,
      flipX: s.flipX ?? false,
      flipY: s.flipY ?? false,
    });
  });

  // Sort according to customLayerOrder if present, keeping unlisted items on top
  if (customLayerOrder.length > 0) {
    return defaultLayers.sort((a, b) => {
      const idxA = customLayerOrder.indexOf(a.id);
      const idxB = customLayerOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  return defaultLayers;
}

/**
 * Reorders a layer item by moving it one step up (higher Z-index / to front)
 */
export function moveLayerUp(order: string[], layerId: string): string[] {
  const idx = order.indexOf(layerId);
  if (idx === -1 || idx === order.length - 1) return order;
  const newOrder = [...order];
  const temp = newOrder[idx];
  newOrder[idx] = newOrder[idx + 1];
  newOrder[idx + 1] = temp;
  return newOrder;
}

/**
 * Reorders a layer item by moving it one step down (lower Z-index / to back)
 */
export function moveLayerDown(order: string[], layerId: string): string[] {
  const idx = order.indexOf(layerId);
  if (idx <= 0) return order;
  const newOrder = [...order];
  const temp = newOrder[idx];
  newOrder[idx] = newOrder[idx - 1];
  newOrder[idx - 1] = temp;
  return newOrder;
}

/**
 * Moves a layer directly to the very top (highest Z-index)
 */
export function bringLayerToFront(order: string[], layerId: string): string[] {
  const filtered = order.filter((id) => id !== layerId);
  return [...filtered, layerId];
}

/**
 * Moves a layer directly to the very bottom (lowest Z-index)
 */
export function sendLayerToBack(order: string[], layerId: string): string[] {
  const filtered = order.filter((id) => id !== layerId);
  return [layerId, ...filtered];
}
