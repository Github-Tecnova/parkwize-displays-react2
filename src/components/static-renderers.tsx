// StaticFrameRenderer & StaticDesignRenderer
// Drop-in replacements that avoid ResizeObserver (Chrome 56 compatible)
// Scale is derived directly from the canvas config — no DOM observation needed.

import React, { useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const renderBackground = (background: any): string => {
  switch (background.type) {
    case "color":
      return background.color || "#ffffff";
    case "gradient":
      if (background.gradient) {
        const { type, direction, stops } = background.gradient;
        const stopStrings = stops
          .map((stop: any) => stop.color + " " + stop.position + "%")
          .join(", ");
        return type === "linear"
          ? "linear-gradient(" + direction + "deg, " + stopStrings + ")"
          : "radial-gradient(circle, " + stopStrings + ")";
      }
      return "#ffffff";
    case "image":
      if (background.image) {
        return "url(" + background.image.url + ")";
      }
      return "#ffffff";
    default:
      return "#ffffff";
  }
};

// ---------------------------------------------------------------------------
// StaticFrameRenderer
// Renders a single DesignFrame at its native canvas size.
// No ResizeObserver, no scaling — plain and compatible.
// ---------------------------------------------------------------------------

interface StaticFrameRendererProps {
  config: any;
  textFormatter: (text: string) => string;
}

export function StaticFrameRenderer({
  config,
  textFormatter,
}: StaticFrameRendererProps) {
  useEffect(() => {
    if (document.getElementById("display-renderer-animations")) return;
    var styleSheet = document.createElement("style");
    styleSheet.id = "display-renderer-animations";
    styleSheet.textContent = [
      "@keyframes fadeInOut { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }",
      "@keyframes slideInOut { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(20px); } }",
      "@keyframes bounceInOut { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-10px); } 50% { transform: translateY(0); } 75% { transform: translateY(-5px); } }",
      "@keyframes pulseInOut { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }",
      "@keyframes spinRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }",
    ].join(" ");
    document.head.appendChild(styleSheet);
  }, []);

  var ElementRenderer = function ({ element }: { element: any }) {
    var baseStyles: React.CSSProperties = {
      position: "absolute",
      left: element.position.x,
      top: element.position.y,
      zIndex: element.position.z,
      width: element.size.width === "auto" ? "auto" : element.size.width,
      height: element.size.height === "auto" ? "auto" : element.size.height,
      transform:
        "rotate(" + element.transform.rotation + "deg)" +
        " scale(" + element.transform.scaleX + ", " + element.transform.scaleY + ")" +
        " skew(" + element.transform.skewX + "deg, " + element.transform.skewY + "deg)",
      margin:
        element.margin.top + "px " +
        element.margin.right + "px " +
        element.margin.bottom + "px " +
        element.margin.left + "px",
      padding:
        element.padding.top + "px " +
        element.padding.right + "px " +
        element.padding.bottom + "px " +
        element.padding.left + "px",
      border:
        element.border.style !== "none"
          ? element.border.width + "px " + element.border.style + " " + element.border.color
          : "none",
      borderRadius: element.border.radius,
      background: renderBackground(element.background),
      boxShadow: element.shadow.enabled
        ? element.shadow.offsetX + "px " +
          element.shadow.offsetY + "px " +
          element.shadow.blur + "px " +
          element.shadow.spread + "px " +
          "#000000"
        : "none",
      display: element.visible ? undefined : "none",
      visibility: element.visible ? "visible" : "hidden",
    };

    switch (element.type) {
      case "text":
        var textElement = element as any;
        return (
          <div
            style={Object.assign({}, baseStyles, {
              background:
                element.background.type === "color" &&
                element.background.color === "#ffffff"
                  ? "transparent"
                  : renderBackground(element.background),
              color: textElement.color,
              fontFamily: textElement.typography.fontFamily,
              fontSize: textElement.typography.fontSize,
              fontWeight: textElement.typography.fontWeight,
              lineHeight: textElement.typography.lineHeight,
              letterSpacing: textElement.typography.letterSpacing,
              textTransform: textElement.typography.textTransform,
              textDecoration: textElement.typography.textDecoration,
              textAlign: textElement.textAlign,
              display: element.visible ? "flex" : "none",
              alignItems:
                textElement.verticalAlign === "top"
                  ? "flex-start"
                  : textElement.verticalAlign === "bottom"
                  ? "flex-end"
                  : "center",
              justifyContent:
                textElement.textAlign === "left"
                  ? "flex-start"
                  : textElement.textAlign === "right"
                  ? "flex-end"
                  : textElement.textAlign === "center"
                  ? "center"
                  : "flex-start",
            })}
          >
            <span style={{ textAlign: textElement.textAlign, width: "100%" }}>
              {textFormatter(textElement.content)}
            </span>
          </div>
        );

      case "image":
        var imageElement = element as any;
        return (
          <div
            style={Object.assign({}, baseStyles, {
              backgroundColor: "transparent",
              backgroundImage: "none",
              display: element.visible ? "block" : "none",
            })}
          >
            <img
              src={imageElement.src}
              alt={imageElement.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: imageElement.objectFit,
                pointerEvents: "none",
              }}
            />
          </div>
        );

      case "shape":
        var shapeElement = element as any;
        var shapeBackground = (function () {
          if (shapeElement.fillType === "gradient" && shapeElement.fillGradient) {
            var grad = shapeElement.fillGradient;
            var stopStrings = grad.stops
              .map(function (stop: any) { return stop.color + " " + stop.position + "%"; })
              .join(", ");
            return grad.type === "linear"
              ? "linear-gradient(" + grad.direction + "deg, " + stopStrings + ")"
              : "radial-gradient(circle, " + stopStrings + ")";
          }
          return shapeElement.fillColor;
        })();

        return (
          <div
            style={Object.assign({}, baseStyles, {
              background: shapeBackground,
              border: shapeElement.strokeWidth + "px solid " + shapeElement.strokeColor,
              borderRadius:
                shapeElement.shape === "circle"
                  ? "50%"
                  : shapeElement.shape === "rectangle"
                  ? element.border.radius
                  : 0,
            })}
          />
        );

      default:
        return <div style={baseStyles} />;
    }
  };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        width: config.display_config.canvas.width,
        height: config.display_config.canvas.height,
        background: renderBackground(config.display_config.canvas.background),
        padding:
          config.display_config.canvas.padding.top + "px " +
          config.display_config.canvas.padding.right + "px " +
          config.display_config.canvas.padding.bottom + "px " +
          config.display_config.canvas.padding.left + "px",
      }}
    >
      {config.display_config.elements.map(function (element: any) {
        return <ElementRenderer key={element.id} element={element} />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StaticDesignRenderer
// Cycles through DesignFrame[] using setInterval.
// Renders at the canvas's native pixel size — no ResizeObserver.
// Wrap it in your own div and use CSS transform/scale if you need scaling.
// ---------------------------------------------------------------------------

interface StaticDesignRendererProps {
  config: any[];
  onFrameChange?: (frame: any, index: number) => void;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  initialIndex?: number;
  textFormatter: (text: string) => string;
}

export function StaticDesignRenderer({
  config,
  onFrameChange,
  className,
  autoPlay = true,
  loop = true,
  initialIndex = 0,
  textFormatter,
}: StaticDesignRendererProps) {
  var frames = useMemo(function () { return config || []; }, [config]);
  var [currentIdx, setCurrentIdx] = useState(initialIndex);

  useEffect(function () {
    if (!autoPlay || frames.length === 0) return;
    var duration = Math.max(1000, (frames[currentIdx] && frames[currentIdx].duration ? frames[currentIdx].duration : 0) * 1000);
    var interval = setInterval(function () {
      setCurrentIdx(function (prev) {
        var next = prev + 1;
        if (next >= frames.length) {
          return loop ? 0 : prev;
        }
        return next;
      });
    }, duration);
    return function () { clearInterval(interval); };
  }, [currentIdx, frames, autoPlay, loop]);

  useEffect(function () {
    if (frames.length > 0 && onFrameChange) {
      onFrameChange(frames[currentIdx], currentIdx);
    }
  }, [currentIdx]);

  if (!frames || frames.length === 0) {
    return React.createElement("div", { className: className });
  }

  var frame = frames[currentIdx];

  return React.createElement(
    "div",
    { className: className },
    React.createElement(StaticFrameRenderer, {
      key: currentIdx,
      config: frame,
      textFormatter: textFormatter,
    }),
  );
}
