"use client";

import { useState, useCallback, useMemo } from "react";

export type ActiveTool =
  | "SELECT"
  | "ERASE"
  | "RESTORE"
  | "MAGIC_EDGE"
  | "FEATHER"
  | "COLOR_WAND";

export interface EditorToolState {
  activeTool: ActiveTool;
  brushSize: number;
  brushHardness: number;
  brushOpacity: number;
  tolerance: number;
  ghostOverlayOpacity: number;
  zoomLevel: number;
  setActiveTool: (tool: ActiveTool) => void;
  setBrushSize: (size: number | ((prev: number) => number)) => void;
  setBrushHardness: (hardness: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setTolerance: (tol: number) => void;
  setGhostOverlayOpacity: (opacity: number) => void;
  setZoomLevel: (zoom: number) => void;
  toggleTool: (tool: ActiveTool) => void;
  isDrawingMode: boolean;
}

export const DEFAULT_BRUSH_SIZE = 24;
export const MIN_BRUSH_SIZE = 4;
export const MAX_BRUSH_SIZE = 120;

export function useEditorState(
  initialTool: ActiveTool = "SELECT",
  initialBrushSize: number = DEFAULT_BRUSH_SIZE
) {
  const [activeTool, setActiveToolState] = useState<ActiveTool>(initialTool);
  const [brushSize, setBrushSizeState] = useState<number>(() =>
    Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, initialBrushSize))
  );
  const [brushHardness, setBrushHardness] = useState<number>(85);
  const [brushOpacity, setBrushOpacity] = useState<number>(1.0);
  const [tolerance, setTolerance] = useState<number>(30);
  const [ghostOverlayOpacity, setGhostOverlayOpacity] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const setActiveTool = useCallback((tool: ActiveTool) => {
    setActiveToolState(tool);
  }, []);

  const setBrushSize = useCallback((size: number | ((prev: number) => number)) => {
    setBrushSizeState((prev) => {
      const nextVal = typeof size === "function" ? size(prev) : size;
      return Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, Math.round(nextVal)));
    });
  }, []);

  const toggleTool = useCallback((tool: ActiveTool) => {
    setActiveToolState((current) => (current === tool ? "SELECT" : tool));
  }, []);

  const isDrawingMode = useMemo(
    () =>
      activeTool === "ERASE" ||
      activeTool === "RESTORE" ||
      activeTool === "MAGIC_EDGE" ||
      activeTool === "FEATHER" ||
      activeTool === "COLOR_WAND",
    [activeTool]
  );

  return {
    activeTool,
    brushSize,
    brushHardness,
    brushOpacity,
    tolerance,
    ghostOverlayOpacity,
    zoomLevel,
    setActiveTool,
    setBrushSize,
    setBrushHardness,
    setBrushOpacity,
    setTolerance,
    setGhostOverlayOpacity,
    setZoomLevel,
    toggleTool,
    isDrawingMode,
  };
}

export default useEditorState;
