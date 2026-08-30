"use client";

import { useState, useCallback, useMemo } from "react";

export type ActiveTool = "SELECT" | "ERASE" | "RESTORE";

export interface EditorToolState {
  activeTool: ActiveTool;
  brushSize: number;
  setActiveTool: (tool: ActiveTool) => void;
  setBrushSize: (size: number | ((prev: number) => number)) => void;
  toggleTool: (tool: ActiveTool) => void;
  isDrawingMode: boolean;
}

export const DEFAULT_BRUSH_SIZE = 20;
export const MIN_BRUSH_SIZE = 5;
export const MAX_BRUSH_SIZE = 100;

export function useEditorState(initialTool: ActiveTool = "SELECT", initialBrushSize: number = DEFAULT_BRUSH_SIZE) {
  const [activeTool, setActiveToolState] = useState<ActiveTool>(initialTool);
  const [brushSize, setBrushSizeState] = useState<number>(() =>
    Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, initialBrushSize))
  );

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

  const isDrawingMode = useMemo(() => activeTool === "ERASE" || activeTool === "RESTORE", [activeTool]);

  return {
    activeTool,
    brushSize,
    setActiveTool,
    setBrushSize,
    toggleTool,
    isDrawingMode,
  };
}

export default useEditorState;
