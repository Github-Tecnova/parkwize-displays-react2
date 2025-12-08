import React, { useEffect, useRef, useState } from "react";
import { DisplayRenderer } from "./display-renderer";
import { EnhancedDisplayConfig } from "@evovee/tecnova-types";

interface ResponsiveDisplayRendererProps {
  config: EnhancedDisplayConfig;
  fit?: "contain" | "cover" | "fill";
  containerStyle?: React.CSSProperties;
  minScale?: number;
  maxScale?: number;
  textFormatter: (text: string) => string;
}

export function ResponsiveDisplayRenderer({
  config,
  fit = "contain",
  containerStyle,
  minScale = 0.1,
  maxScale = 5,
  textFormatter,
}: ResponsiveDisplayRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !displayRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Get the actual display dimensions
      const displayWidth = config.canvas.width;
      const displayHeight = config.canvas.height;

      if (containerWidth === 0 || containerHeight === 0) return;

      let newScale = 1;

      switch (fit) {
        case "contain":
          // Scale to fit entirely within container while maintaining aspect ratio
          const scaleX = containerWidth / displayWidth;
          const scaleY = containerHeight / displayHeight;
          newScale = Math.min(scaleX, scaleY);
          break;

        case "cover":
          // Scale to cover entire container while maintaining aspect ratio
          const scaleXCover = containerWidth / displayWidth;
          const scaleYCover = containerHeight / displayHeight;
          newScale = Math.max(scaleXCover, scaleYCover);
          break;

        case "fill":
          // Scale to fill container exactly (may distort aspect ratio)
          const scaleXFill = containerWidth / displayWidth;
          const scaleYFill = containerHeight / displayHeight;
          // For fill, we'll use different scales for X and Y, but for now use average
          newScale = (scaleXFill + scaleYFill) / 2;
          break;
      }

      // Apply min/max scale constraints
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      setScale(newScale);
      setContainerSize({ width: containerWidth, height: containerHeight });
    };

    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to avoid layout thrashing
      requestAnimationFrame(updateScale);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial scale calculation
    updateScale();

    return () => {
      resizeObserver.disconnect();
    };
  }, [config.canvas.width, config.canvas.height, fit, minScale, maxScale]);

  // Calculate the scaled dimensions
  const scaledWidth = config.canvas.width * scale;
  const scaledHeight = config.canvas.height * scale;

  return (
    <div
      ref={containerRef}
      style={{
        overflow: "hidden",
        // Container sizes itself to the scaled display
        width: fit === "fill" ? "100%" : `${scaledWidth}px`,
        height: fit === "fill" ? "100%" : `${scaledHeight}px`,
        minWidth: fit === "contain" ? "auto" : undefined,
        minHeight: fit === "contain" ? "auto" : undefined,
        ...containerStyle,
      }}
    >
      <div
        ref={displayRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          width: config.canvas.width,
          height: config.canvas.height,
        }}
      >
        <DisplayRenderer config={config} textFormatter={textFormatter} />
      </div>
    </div>
  );
}
