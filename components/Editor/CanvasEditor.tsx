"use client";

import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
  Transformer,
  Rect,
} from "react-konva";
import Konva from "konva";
import { generateDieCutOutlineCanvas } from "../../utils/stickerEffects";

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  align?: "left" | "center" | "right";
  scaleX?: number;
  scaleY?: number;
}

export interface DrawingLine {
  id?: string;
  points: number[];
  tool: "erase" | "restore" | "magic_edge" | "feather" | "color_wand";
  brushSize: number;
  opacity?: number;
  hardness?: number;
}

export interface CanvasImageTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface CanvasEditorHandle {
  exportImage: () => string | null;
  stageRef: Konva.Stage | null;
  fitAndCenterImage: () => void;
  resetTransform: () => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
}

export interface CanvasEditorProps {
  imageUrl: string | null;
  textElements?: TextElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateText?: (id: string, newAttrs: Partial<TextElement>) => void;
  onEditTextInline?: (id: string) => void;
  showSafeZone?: boolean;
  strokeWidth?: number;
  strokeColor?: string;
}

const STAGE_SIZE = 512;

export const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  (
    {
      imageUrl,
      textElements = [],
      selectedId,
      onSelect,
      onUpdateText,
      onEditTextInline,
      showSafeZone = true,
      strokeWidth = 0,
      strokeColor = "#ffffff",
    },
    ref
  ) => {
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<Konva.Image>(null);
    const outlineRef = useRef<Konva.Image>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const textNodesRef = useRef<{ [key: string]: Konva.Text | null }>({});

    // Responsive viewport size
    const [viewportSize, setViewportSize] = useState<number>(STAGE_SIZE);
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
    const [outlineCanvas, setOutlineCanvas] = useState<HTMLCanvasElement | null>(null);

    // Image Transform coordinates (default centered at 256, 256)
    const [imageTransform, setImageTransform] = useState<CanvasImageTransform>({
      x: STAGE_SIZE / 2,
      y: STAGE_SIZE / 2,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });

    // ResizeObserver to keep canvas strictly square and 1:1 responsive
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const updateSize = () => {
        const rect = container.getBoundingClientRect();
        const minDim = Math.min(rect.width, rect.height);
        if (minDim > 0) {
          setViewportSize(minDim);
        }
      };

      updateSize();
      const observer = new ResizeObserver(updateSize);
      observer.observe(container);

      return () => observer.disconnect();
    }, []);

    // Load Image Object & auto-fit into 512x512 with safe margins
    useEffect(() => {
      if (!imageUrl) {
        setImageObj(null);
        setOutlineCanvas(null);
        return;
      }

      let isCurrent = true;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      img.onload = () => {
        if (!isCurrent) return;
        setImageObj(img);

        // Auto-fit image within 512x512 (allowing 32px safe zone padding)
        const maxContentSize = STAGE_SIZE - 48; // 464px
        const scale = Math.min(
          maxContentSize / img.width,
          maxContentSize / img.height,
          1.5
        );

        setImageTransform({
          x: STAGE_SIZE / 2,
          y: STAGE_SIZE / 2,
          scaleX: scale,
          scaleY: scale,
          rotation: 0,
        });
      };

      return () => {
        isCurrent = false;
      };
    }, [imageUrl]);

    // Generate White / Colored Sticker Die-Cut Outline when enabled
    useEffect(() => {
      if (!imageObj || strokeWidth <= 0) {
        setOutlineCanvas(null);
        return;
      }

      const generated = generateDieCutOutlineCanvas(imageObj, {
        enabled: true,
        width: strokeWidth,
        color: strokeColor,
        shadowEnabled: true,
        shadowBlur: 4,
        shadowOffsetY: 2,
        shadowColor: "rgba(0, 0, 0, 0.4)",
      });

      setOutlineCanvas(generated);
    }, [imageObj, strokeWidth, strokeColor]);

    // Attach/Detach Transformer cleanly to either subject image or selected text element
    useEffect(() => {
      const tr = transformerRef.current;
      if (!tr) return;

      if (selectedId === "subject-image" && imageRef.current) {
        tr.nodes([imageRef.current]);
        tr.getLayer()?.batchDraw();
      } else if (selectedId && textNodesRef.current[selectedId]) {
        const textNode = textNodesRef.current[selectedId];
        if (textNode) {
          tr.nodes([textNode]);
          tr.getLayer()?.batchDraw();
        }
      } else {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
      }
    }, [selectedId, imageObj, textElements]);

    // Fit & Center image helper
    const fitAndCenterImage = useCallback(() => {
      if (!imageObj) return;
      const maxContentSize = STAGE_SIZE - 48;
      const scale = Math.min(
        maxContentSize / imageObj.width,
        maxContentSize / imageObj.height,
        1.5
      );
      setImageTransform({
        x: STAGE_SIZE / 2,
        y: STAGE_SIZE / 2,
        scaleX: scale,
        scaleY: scale,
        rotation: 0,
      });
    }, [imageObj]);

    // Reset transform
    const resetTransform = useCallback(() => {
      setImageTransform({
        x: STAGE_SIZE / 2,
        y: STAGE_SIZE / 2,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      });
    }, []);

    // Flip horizontal
    const flipHorizontal = useCallback(() => {
      setImageTransform((prev) => ({
        ...prev,
        scaleX: prev.scaleX * -1,
      }));
    }, []);

    // Flip vertical
    const flipVertical = useCallback(() => {
      setImageTransform((prev) => ({
        ...prev,
        scaleY: prev.scaleY * -1,
      }));
    }, []);

    // Expose imperative handle for WYSIWYG export
    useImperativeHandle(ref, () => ({
      exportImage: () => {
        if (!stageRef.current) return null;

        // Deselect any bounding boxes before capturing snapshot
        const tr = transformerRef.current;
        const currentNodes = tr?.nodes() || [];
        if (tr) tr.nodes([]);

        const stage = stageRef.current;
        // Export strictly at 512x512 with transparent background
        const dataUrl = stage.toDataURL({
          pixelRatio: STAGE_SIZE / viewportSize,
          mimeType: "image/webp",
          quality: 0.9,
        });

        // Restore transformer
        if (tr && currentNodes.length > 0) {
          tr.nodes(currentNodes);
          tr.getLayer()?.batchDraw();
        }

        return dataUrl;
      },
      stageRef: stageRef.current,
      fitAndCenterImage,
      resetTransform,
      flipHorizontal,
      flipVertical,
    }));

    // Konva scale factor to map 512 virtual coordinates to responsive container
    const stageScale = viewportSize / STAGE_SIZE;

    return (
      <div
        ref={containerRef}
        id="canvas-editor-container"
        className="relative w-full h-full flex items-center justify-center select-none overflow-hidden touch-none"
        onClick={(e) => {
          // Deselect when clicking outside active nodes
          if (e.target === e.currentTarget) {
            onSelect(null);
          }
        }}
      >
        {/* Subtle Checkered Transparency Background for WYSIWYG perception */}
        <div
          className="relative shadow-2xl rounded-2xl overflow-hidden"
          style={{
            width: viewportSize,
            height: viewportSize,
            backgroundImage: `
              linear-gradient(45deg, #1c1c1e 25%, transparent 25%),
              linear-gradient(-45deg, #1c1c1e 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1c1c1e 75%),
              linear-gradient(-45deg, transparent 75%, #1c1c1e 75%)
            `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            backgroundColor: "#121214",
          }}
        >
          <Stage
            ref={stageRef}
            width={viewportSize}
            height={viewportSize}
            scaleX={stageScale}
            scaleY={stageScale}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) {
                onSelect(null);
              }
            }}
            onTouchStart={(e) => {
              if (e.target === e.target.getStage()) {
                onSelect(null);
              }
            }}
          >
            {/* Layer 1: Sticker Outline (rendered right below subject) */}
            <Layer>
              {outlineCanvas && imageObj && (
                <KonvaImage
                  ref={outlineRef}
                  image={outlineCanvas}
                  x={imageTransform.x}
                  y={imageTransform.y}
                  offsetX={imageObj.width / 2}
                  offsetY={imageObj.height / 2}
                  scaleX={imageTransform.scaleX}
                  scaleY={imageTransform.scaleY}
                  rotation={imageTransform.rotation}
                  listening={false}
                />
              )}
            </Layer>

            {/* Layer 2: Subject Cutout Image Layer */}
            <Layer>
              {imageObj && (
                <KonvaImage
                  ref={imageRef}
                  id="subject-image"
                  image={imageObj}
                  x={imageTransform.x}
                  y={imageTransform.y}
                  offsetX={imageObj.width / 2}
                  offsetY={imageObj.height / 2}
                  scaleX={imageTransform.scaleX}
                  scaleY={imageTransform.scaleY}
                  rotation={imageTransform.rotation}
                  draggable
                  onClick={() => onSelect("subject-image")}
                  onTap={() => onSelect("subject-image")}
                  onDragEnd={(e) => {
                    setImageTransform((prev) => ({
                      ...prev,
                      x: e.target.x(),
                      y: e.target.y(),
                    }));
                  }}
                  onTransformEnd={() => {
                    const node = imageRef.current;
                    if (!node) return;
                    setImageTransform({
                      x: node.x(),
                      y: node.y(),
                      scaleX: node.scaleX(),
                      scaleY: node.scaleY(),
                      rotation: node.rotation(),
                    });
                  }}
                />
              )}
            </Layer>

            {/* Layer 3: Text & Meme Typography Layer */}
            <Layer>
              {textElements.map((txt) => (
                <KonvaText
                  key={txt.id}
                  id={txt.id}
                  ref={(node) => {
                    textNodesRef.current[txt.id] = node;
                  }}
                  text={txt.text}
                  x={txt.x}
                  y={txt.y}
                  fontSize={txt.fontSize}
                  fontFamily={txt.fontFamily || "Impact"}
                  fontStyle={txt.fontFamily === "Impact" ? "bold" : "normal"}
                  fill={txt.fill}
                  stroke={txt.stroke || "#000000"}
                  strokeWidth={txt.strokeWidth ?? 4}
                  lineJoin="round"
                  rotation={txt.rotation || 0}
                  scaleX={txt.scaleX ?? 1}
                  scaleY={txt.scaleY ?? 1}
                  align={txt.align || "center"}
                  draggable
                  onClick={() => onSelect(txt.id)}
                  onTap={() => onSelect(txt.id)}
                  onDblClick={() => onEditTextInline?.(txt.id)}
                  onDblTap={() => onEditTextInline?.(txt.id)}
                  onDragEnd={(e) => {
                    onUpdateText?.(txt.id, {
                      x: e.target.x(),
                      y: e.target.y(),
                    });
                  }}
                  onTransformEnd={() => {
                    const node = textNodesRef.current[txt.id];
                    if (!node) return;
                    onUpdateText?.(txt.id, {
                      x: node.x(),
                      y: node.y(),
                      scaleX: node.scaleX(),
                      scaleY: node.scaleY(),
                      rotation: node.rotation(),
                    });
                  }}
                />
              ))}
            </Layer>

            {/* Layer 4: Controls, Guides & Transformer */}
            <Layer>
              {/* WhatsApp 16px Safe-Zone Border (Inset 16px -> 480x480 active box) */}
              {showSafeZone && (
                <Rect
                  x={16}
                  y={16}
                  width={STAGE_SIZE - 32}
                  height={STAGE_SIZE - 32}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth={1.5}
                  dash={[6, 6]}
                  listening={false}
                />
              )}

              {/* Minimalist Native Transformer */}
              <Transformer
                ref={transformerRef}
                rotateEnabled
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                  // Prevent inverting or collapsing below 20px
                  if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                    return oldBox;
                  }
                  return newBox;
                }}
                anchorCornerRadius={6}
                anchorSize={14}
                anchorFill="#ffffff"
                anchorStroke="#2563eb"
                anchorStrokeWidth={2}
                borderStroke="#3b82f6"
                borderStrokeWidth={1.5}
                borderDash={[4, 4]}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
);

CanvasEditor.displayName = "CanvasEditor";
