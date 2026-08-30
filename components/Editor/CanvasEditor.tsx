"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
  Transformer,
  Circle,
  Line,
  Group,
} from "react-konva";
import Konva from "konva";
import { ActiveTool } from "../../hooks/useEditorState";

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
}

export interface DrawingLine {
  points: number[];
  tool: "erase" | "restore";
  brushSize: number;
}

export interface CanvasEditorProps {
  imageUrl: string | null;
  originalImageUrl?: string | null;
  textElements: TextElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateText: (id: string, newAttrs: Partial<TextElement>) => void;
  activeTool?: ActiveTool;
  brushSize?: number;
  onImageModified?: (newDataUrl: string) => void;
}

export interface CanvasEditorHandle {
  exportImage: () => string | null;
  stageRef: Konva.Stage | null;
  clearLines: () => void;
  lines: DrawingLine[];
}

export const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  (
    {
      imageUrl,
      originalImageUrl,
      textElements,
      selectedId,
      onSelect,
      onUpdateText,
      activeTool = "SELECT",
      brushSize = 20,
      onImageModified,
    },
    ref
  ) => {
    const stageRef = useRef<Konva.Stage>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const stickerGroupRef = useRef<Konva.Group>(null);

    // Freehand drawing lines state array
    const [lines, setLines] = useState<DrawingLine[]>([]);

    // Image elements for compositing (cutout and original un-processed photo)
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
    const [originalImageElement, setOriginalImageElement] = useState<HTMLImageElement | null>(null);

    // Cursor tracking for brush preview
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
      x: -100,
      y: -100,
      visible: false,
    });
    const isDrawingRef = useRef(false);

    const isDrawingMode = activeTool === "ERASE" || activeTool === "RESTORE";

    // Load original un-processed image for restore reference
    useEffect(() => {
      if (!originalImageUrl) {
        setOriginalImageElement(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = originalImageUrl;
      img.onload = () => {
        setOriginalImageElement(img);
      };
    }, [originalImageUrl]);

    // Load AI-processed cutout sticker image element
    useEffect(() => {
      if (!imageUrl) {
        setImageElement(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        setImageElement(img);
      };
    }, [imageUrl]);

    // Export handle & ref methods
    useImperativeHandle(ref, () => ({
      exportImage: () => {
        if (!stageRef.current) return null;
        if (trRef.current) {
          trRef.current.nodes([]);
        }
        return stageRef.current.toDataURL({ pixelRatio: 1, mimeType: "image/webp" });
      },
      stageRef: stageRef.current,
      clearLines: () => setLines([]),
      lines,
    }));

    // Center unified sticker group on initial image load
    useEffect(() => {
      if (imageElement && stickerGroupRef.current) {
        const group = stickerGroupRef.current;
        const stageWidth = 512;
        const stageHeight = 512;
        const imgW = imageElement.width || 512;
        const imgH = imageElement.height || 512;
        const scale = Math.min((stageWidth * 0.8) / imgW, (stageHeight * 0.8) / imgH);

        if (group.x() === 0 && group.y() === 0) {
          group.scaleX(scale);
          group.scaleY(scale);
          group.position({
            x: (stageWidth - imgW * scale) / 2,
            y: (stageHeight - imgH * scale) / 2,
          });
          group.getLayer()?.batchDraw();
        }
      }
    }, [imageElement]);

    // Update transformer selection
    useEffect(() => {
      if (!trRef.current || !stageRef.current) return;

      if (!selectedId || isDrawingMode) {
        trRef.current.nodes([]);
        trRef.current.getLayer()?.batchDraw();
        return;
      }

      const targetId =
        selectedId === "main-sticker-image" || selectedId === "main-sticker-group"
          ? "main-sticker-group"
          : selectedId;

      const selectedNode = stageRef.current.findOne(`#${targetId}`);
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
        trRef.current.getLayer()?.batchDraw();
      } else {
        trRef.current.nodes([]);
      }
    }, [selectedId, textElements, imageElement, isDrawingMode]);

    // Stage Pointer Event Handlers for Freehand Drawing & Selection
    const handlePointerDown = (e: any) => {
      if (isDrawingMode) {
        isDrawingRef.current = true;
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();

        if (pos) {
          const groupNode = stickerGroupRef.current;
          let localPos = pos;
          let scale = 1;
          if (groupNode) {
            const transform = groupNode.getAbsoluteTransform().copy().invert();
            localPos = transform.point(pos);
            scale = groupNode.scaleX() || 1;
          }

          const currentTool: "erase" | "restore" =
            activeTool.toLowerCase() === "erase" ? "erase" : "restore";

          const normalizedBrushSize = Math.max(2, brushSize / scale);

          const newLine: DrawingLine = {
            tool: currentTool,
            points: [localPos.x, localPos.y],
            brushSize: normalizedBrushSize,
          };

          setLines((prev) => [...prev, newLine]);
        }
      } else {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          onSelect(null);
        }
      }
    };

    const handlePointerMove = (e: any) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();

      if (pos) {
        if (isDrawingMode) {
          setCursorPos({ x: pos.x, y: pos.y, visible: true });

          if (isDrawingRef.current) {
            const groupNode = stickerGroupRef.current;
            let localPos = pos;
            if (groupNode) {
              const transform = groupNode.getAbsoluteTransform().copy().invert();
              localPos = transform.point(pos);
            }

            setLines((prevLines) => {
              if (prevLines.length === 0) return prevLines;
              const lastLine = { ...prevLines[prevLines.length - 1] };
              // Append new local coordinate pair
              lastLine.points = lastLine.points.concat([localPos.x, localPos.y]);
              const updatedLines = [...prevLines];
              updatedLines.splice(updatedLines.length - 1, 1, lastLine);
              return updatedLines;
            });
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        if (onImageModified && stageRef.current) {
          // Trigger reactive export update when drawing stroke finishes
          const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1, mimeType: "image/webp" });
          if (dataUrl) {
            onImageModified(dataUrl);
          }
        }
      }
    };

    const handlePointerLeave = () => {
      setCursorPos((prev) => ({ ...prev, visible: false }));
      if (isDrawingRef.current) {
        handlePointerUp();
      }
    };

    const imageWidth = imageElement?.width || 512;
    const imageHeight = imageElement?.height || 512;

    const eraseLines = lines.filter((l) => l.tool === "erase");
    const restoreLines = lines.filter((l) => l.tool === "restore");

    return (
      <div className="relative flex w-full items-center justify-center select-none">
        {/* Outer Frame with WhatsApp sticker checkerboard pattern */}
        <div
          id="canvas-stage-wrapper"
          className={`relative aspect-square w-full max-w-[480px] sm:max-w-[512px] overflow-hidden rounded-3xl border-2 bg-zinc-950 shadow-2xl transition-all ${
            activeTool === "ERASE"
              ? "border-rose-500/50 shadow-rose-950/40 cursor-crosshair"
              : activeTool === "RESTORE"
              ? "border-emerald-500/50 shadow-emerald-950/40 cursor-crosshair"
              : "border-white/20"
          }`}
          onMouseLeave={handlePointerLeave}
        >
          {/* Transparency checkerboard background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #27272a 25%, transparent 25%), linear-gradient(-45deg, #27272a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #27272a 75%), linear-gradient(-45deg, transparent 75%, #27272a 75%)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
            }}
          />

          {/* Konva Stage Container with responsive scale */}
          <div className="relative h-full w-full [&>div]:!w-full [&>div]:!h-full [&_canvas]:!w-full [&_canvas]:!h-full">
            <Stage
              ref={stageRef}
              width={512}
              height={512}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className="touch-none"
            >
              {/* Image & Erase/Restore Compositing Layer */}
              <Layer>
                {/* 
                  Unified Sticker Entity Group:
                  Contains the base AI cutout, original photo restore mask, and erase strokes.
                  When activeTool === 'SELECT', this group moves, scales, and rotates as one entity.
                */}
                <Group
                  id="main-sticker-group"
                  ref={stickerGroupRef}
                  draggable={!isDrawingMode}
                  onClick={() => !isDrawingMode && onSelect("main-sticker-group")}
                  onTap={() => !isDrawingMode && onSelect("main-sticker-group")}
                >
                  {/* 1. Bottom Layer: Restored Original Image revealed by restore strokes */}
                  {originalImageElement && restoreLines.length > 0 && (
                    <Group id="restored-pixels-layer">
                      <KonvaImage
                        image={originalImageElement}
                        width={imageWidth}
                        height={imageHeight}
                      />
                      {restoreLines.map((line, index) => (
                        <Line
                          key={`restore-line-${index}`}
                          points={line.points}
                          stroke="rgba(0,0,0,1)"
                          strokeWidth={line.brushSize}
                          tension={0.5}
                          lineCap="round"
                          lineJoin="round"
                          globalCompositeOperation="destination-in"
                        />
                      ))}
                    </Group>
                  )}

                  {/* 2. Middle Layer: AI Cutout Image */}
                  {imageElement && (
                    <KonvaImage
                      id="main-sticker-image"
                      image={imageElement}
                      width={imageWidth}
                      height={imageHeight}
                    />
                  )}

                  {/* 3. Top Erase Layer: Punches holes through cutout and restored areas */}
                  {eraseLines.map((line, index) => (
                    <Line
                      key={`erase-line-${index}`}
                      points={line.points}
                      stroke="rgba(0,0,0,1)"
                      strokeWidth={line.brushSize}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation="destination-out"
                    />
                  ))}
                </Group>

                {/* Editable Text Elements with classic sticker outline */}
                {textElements.map((el) => (
                  <KonvaText
                    key={el.id}
                    id={el.id}
                    text={el.text}
                    x={el.x}
                    y={el.y}
                    fontSize={el.fontSize}
                    fontFamily="Space Grotesk, Impact, sans-serif"
                    fontStyle="800"
                    fill={el.fill}
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    fillAfterStrokeEnabled={true}
                    lineJoin="round"
                    align="center"
                    draggable={!isDrawingMode}
                    rotation={el.rotation || 0}
                    onClick={() => !isDrawingMode && onSelect(el.id)}
                    onTap={() => !isDrawingMode && onSelect(el.id)}
                    onDragEnd={(e) => {
                      onUpdateText(el.id, {
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      onUpdateText(el.id, {
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        fontSize: Math.max(14, Math.round(el.fontSize * node.scaleY())),
                      });
                      node.scaleX(1);
                      node.scaleY(1);
                    }}
                  />
                ))}

                {/* Transformer bounding box for selection mode */}
                {!isDrawingMode && (
                  <Transformer
                    ref={trRef}
                    rotateEnabled={true}
                    enabledAnchors={[
                      "top-left",
                      "top-right",
                      "bottom-left",
                      "bottom-right",
                    ]}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                    anchorCornerRadius={6}
                    anchorSize={10}
                    anchorFill="#f97316"
                    anchorStroke="#ffffff"
                    anchorStrokeWidth={2}
                    borderStroke="#f97316"
                    borderStrokeWidth={2}
                    borderDash={[6, 4]}
                  />
                )}

                {/* Live Brush Size Cursor Indicator on Canvas */}
                {isDrawingMode && cursorPos.visible && (
                  <Circle
                    x={cursorPos.x}
                    y={cursorPos.y}
                    radius={brushSize / 2}
                    stroke={activeTool === "ERASE" ? "#f43f5e" : "#10b981"}
                    strokeWidth={2}
                    dash={[4, 3]}
                    fill={
                      activeTool === "ERASE"
                        ? "rgba(244,63,94,0.15)"
                        : "rgba(16,185,129,0.15)"
                    }
                    listening={false}
                  />
                )}
              </Layer>
            </Stage>
          </div>

          {/* Active Tool Mode Badge indicator */}
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-bold text-zinc-300 backdrop-blur-md">
            <span
              className={`h-2 w-2 rounded-full ${
                activeTool === "ERASE"
                  ? "bg-rose-400 shadow-[0_0_8px_#f43f5e]"
                  : activeTool === "RESTORE"
                  ? "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                  : "bg-cyan-400"
              }`}
            />
            <span>
              {activeTool === "ERASE"
                ? `Eraser (${brushSize}px)`
                : activeTool === "RESTORE"
                ? `Restore Brush (${brushSize}px)`
                : "Select & Move"}
            </span>
          </div>

          {/* Guide Overlay indicator */}
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 backdrop-blur-md">
            512 × 512 px
          </div>
        </div>
      </div>
    );
  }
);

CanvasEditor.displayName = "CanvasEditor";
export default CanvasEditor;
