import { TextElement, DrawingLine, CanvasImageTransform } from "../components/Editor/CanvasEditor";
import { StickerOutlineConfig } from "./stickerEffects";
import { StickerFilterConfig } from "./filterEffects";
import { CanvasLayerItem } from "./layerManagement";

export interface CanvasHistorySnapshot {
  activeImageUrl: string | null;
  originalImageUrl: string | null;
  imageTransform?: CanvasImageTransform | null;
  textElements: TextElement[];
  lines: DrawingLine[];
  outlineConfig: StickerOutlineConfig;
  filterConfig: StickerFilterConfig;
  layerStates: Record<string, Partial<CanvasLayerItem>>;
  layerOrder: string[];
  selectedId: string | null;
  actionLabel: string;
  timestamp: number;
}

export interface HistoryState {
  past: CanvasHistorySnapshot[];
  present: CanvasHistorySnapshot;
  future: CanvasHistorySnapshot[];
}

export const MAX_HISTORY_STEPS = 35;

/**
 * Deep clones snapshot components to guarantee immutability across undo/redo steps
 */
export function cloneSnapshot(snapshot: CanvasHistorySnapshot): CanvasHistorySnapshot {
  return {
    activeImageUrl: snapshot.activeImageUrl,
    originalImageUrl: snapshot.originalImageUrl,
    imageTransform: snapshot.imageTransform ? { ...snapshot.imageTransform } : null,
    textElements: snapshot.textElements.map((t) => ({ ...t })),
    lines: snapshot.lines.map((l) => ({
      ...l,
      points: [...l.points],
    })),
    outlineConfig: { ...snapshot.outlineConfig },
    filterConfig: { ...snapshot.filterConfig },
    layerStates: Object.keys(snapshot.layerStates || {}).reduce((acc, key) => {
      acc[key] = { ...snapshot.layerStates[key] };
      return acc;
    }, {} as Record<string, Partial<CanvasLayerItem>>),
    layerOrder: [...(snapshot.layerOrder || [])],
    selectedId: snapshot.selectedId,
    actionLabel: snapshot.actionLabel,
    timestamp: snapshot.timestamp,
  };
}

/**
 * Creates an initial history state from initial workspace properties
 */
export function createInitialHistoryState(initial: {
  activeImageUrl: string | null;
  originalImageUrl: string | null;
  imageTransform?: CanvasImageTransform | null;
  textElements: TextElement[];
  lines: DrawingLine[];
  outlineConfig: StickerOutlineConfig;
  filterConfig: StickerFilterConfig;
  layerStates: Record<string, Partial<CanvasLayerItem>>;
  layerOrder: string[];
  selectedId: string | null;
}): HistoryState {
  const initialSnapshot: CanvasHistorySnapshot = {
    activeImageUrl: initial.activeImageUrl,
    originalImageUrl: initial.originalImageUrl,
    imageTransform: initial.imageTransform ? { ...initial.imageTransform } : null,
    textElements: initial.textElements.map((t) => ({ ...t })),
    lines: initial.lines.map((l) => ({ ...l, points: [...l.points] })),
    outlineConfig: { ...initial.outlineConfig },
    filterConfig: { ...initial.filterConfig },
    layerStates: { ...initial.layerStates },
    layerOrder: [...initial.layerOrder],
    selectedId: initial.selectedId,
    actionLabel: "Initial State",
    timestamp: Date.now(),
  };

  return {
    past: [],
    present: initialSnapshot,
    future: [],
  };
}

/**
 * Pushes a new snapshot into history, truncating future redo history and capping at MAX_HISTORY_STEPS
 */
export function pushHistorySnapshot(
  history: HistoryState,
  newSnapshotData: Omit<CanvasHistorySnapshot, "timestamp">
): HistoryState {
  const newSnapshot: CanvasHistorySnapshot = {
    ...cloneSnapshot({
      ...newSnapshotData,
      timestamp: Date.now(),
    }),
  };

  // Truncate past stack to MAX_HISTORY_STEPS
  const newPast = [...history.past, cloneSnapshot(history.present)];
  if (newPast.length > MAX_HISTORY_STEPS) {
    newPast.shift(); // remove oldest
  }

  return {
    past: newPast,
    present: newSnapshot,
    future: [], // New branch clears future redo stack
  };
}

/**
 * Steps backward in history
 */
export function undoHistory(
  history: HistoryState
): { newHistory: HistoryState; restoredSnapshot: CanvasHistorySnapshot } | null {
  if (history.past.length === 0) return null;

  const previousSnapshot = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);
  const newFuture = [cloneSnapshot(history.present), ...history.future];

  const restored = cloneSnapshot(previousSnapshot);

  return {
    newHistory: {
      past: newPast,
      present: restored,
      future: newFuture,
    },
    restoredSnapshot: restored,
  };
}

/**
 * Steps forward in history
 */
export function redoHistory(
  history: HistoryState
): { newHistory: HistoryState; restoredSnapshot: CanvasHistorySnapshot } | null {
  if (history.future.length === 0) return null;

  const nextSnapshot = history.future[0];
  const newFuture = history.future.slice(1);
  const newPast = [...history.past, cloneSnapshot(history.present)];

  const restored = cloneSnapshot(nextSnapshot);

  return {
    newHistory: {
      past: newPast,
      present: restored,
      future: newFuture,
    },
    restoredSnapshot: restored,
  };
}
