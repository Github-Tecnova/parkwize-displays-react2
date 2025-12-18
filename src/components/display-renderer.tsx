import React, { useEffect } from "react";
import {
  Background,
  ContainerElement,
  DisplayElementType,
  EnhancedDisplayConfig,
  ImageElement,
  ShapeElement,
  TextElement,
} from "@evovee/tecnova-types";

interface DisplayRendererProps {
  config: EnhancedDisplayConfig;
  textFormatter: (text: string) => string;
}

// Add renderBackground function
const renderBackground = (background: Background) => {
  switch (background.type) {
    case "color":
      return background.color || "#ffffff";
    case "gradient":
      if (background.gradient) {
        const { type, direction, stops } = background.gradient;
        const stopStrings = stops
          .map((stop: any) => stop.color + " " + stop.position + "%")
          .join(", ");
        if (type === "linear") {
          return "linear-gradient(" + direction + "deg, " + stopStrings + ")";
        } else {
          return "radial-gradient(circle, " + stopStrings + ")";
        }
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

export function DisplayRenderer({
  config,
  textFormatter,
}: DisplayRendererProps) {
  // Add animation styles to the document
  useEffect(() => {
    const style = document.getElementById("display-renderer-animations");
    if (!style) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "display-renderer-animations";
      styleSheet.textContent = `
        @keyframes fadeInOut {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes slideInOut {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        
        @keyframes bounceInOut {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-10px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-5px); }
        }
        
        @keyframes pulseInOut {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes spinRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  const getAnimationStyles = (
    element: DisplayElementType,
  ): React.CSSProperties => {
    if (element.animation.type === "none") return {};

    const {
      type,
      duration,
      delay,
      iteration,
      direction = "normal",
      timing = "ease",
    } = element.animation;

    // Define keyframes for each animation type
    const animations = {
      fade: "fadeInOut",
      slide: "slideInOut",
      bounce: "bounceInOut",
      pulse: "pulseInOut",
      spin: "spinRotate",
    };

    const animationName = animations[type];
    const iterationValue = iteration === "infinite" ? "infinite" : iteration;

    return {
      animation: `${animationName} ${duration}s ${timing} ${delay}s ${iterationValue} ${direction}`,
    };
  };

  const ElementRenderer = ({ element }: { element: DisplayElementType }) => {
    // Base styles without animation
    const baseStyles: React.CSSProperties = {
      position: "absolute",
      left: element.position.x,
      top: element.position.y,
      zIndex: element.position.z,
      width: element.size.width === "auto" ? "auto" : element.size.width,
      height: element.size.height === "auto" ? "auto" : element.size.height,
      transform: "rotate(" + element.transform.rotation + "deg) scale(" + element.transform.scaleX + ", " + element.transform.scaleY + ") skew(" + element.transform.skewX + "deg, " + element.transform.skewY + "deg)",
      margin: element.margin.top + "px " + element.margin.right + "px " + element.margin.bottom + "px " + element.margin.left + "px",
      padding: element.padding.top + "px " + element.padding.right + "px " + element.padding.bottom + "px " + element.padding.left + "px",
      border:
        element.border.style !== "none"
          ? element.border.width + "px " + element.border.style + " " + element.border.color
          : "none",
      borderRadius: element.border.radius,
      background: renderBackground(element.background),
      boxShadow: element.shadow.enabled
        ? element.shadow.offsetX + "px " + element.shadow.offsetY + "px " + element.shadow.blur + "px " + element.shadow.spread + "px " + element.shadow.color
        : "none",
      display: element.visible ? undefined : "none",
      visibility: element.visible ? "visible" : "hidden",
      ...getAnimationStyles(element),
    };

    switch (element.type) {
      case "text":
        const textElement = element as TextElement;
        return (
          <div
            style={{
              ...baseStyles,
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
            }}
          >
            <span style={{ textAlign: textElement.textAlign, width: "100%" }}>
              {textFormatter(textElement.content)}
            </span>
          </div>
        );

      case "image":
        const imageElement = element as ImageElement;
        return (
          <div
            style={{
              ...baseStyles,
              backgroundColor: "transparent", // Remove any background for images
              backgroundImage: "none", // Remove any background image
              display: element.visible ? "block" : "none",
            }}
          >
            <img
              src={imageElement.src}
              alt={imageElement.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: imageElement.objectFit,
                /*filter: `
                  brightness(${imageElement.filters.brightness}%)
                  contrast(${imageElement.filters.contrast}%)
                  saturate(${imageElement.filters.saturation}%)
                  blur(${imageElement.filters.blur}px)
                  hue-rotate(${imageElement.filters.hueRotate}deg)
                `,*/
                pointerEvents: "none",
              }}
            />
          </div>
        );

      case "shape":
        const shapeElement = element as ShapeElement;

        const renderShapeBackground = () => {
          if (
            shapeElement.fillType === "gradient" &&
            shapeElement.fillGradient
          ) {
            const { type, direction, stops } = shapeElement.fillGradient;
            const stopStrings = stops
              .map((stop) => stop.color + " " + stop.position + "%")
              .join(", ");
            if (type === "linear") {
              return "linear-gradient(" + direction + "deg, " + stopStrings + ")";
            } else {
              return "radial-gradient(circle, " + stopStrings + ")";
            }
          }
          return shapeElement.fillColor;
        };

        return (
          <div
            style={{
              ...baseStyles,
              background: renderShapeBackground(),
              border: shapeElement.strokeWidth + "px solid " + shapeElement.strokeColor,
              borderRadius:
                shapeElement.shape === "circle"
                  ? "50%"
                  : shapeElement.shape === "rectangle"
                    ? element.border.radius
                    : 0,
            }}
          />
        );

      case "container":
        const containerElement = element as ContainerElement;
        const containerStyles: React.CSSProperties = {
          ...baseStyles,
          display: element.visible
            ? containerElement.layout === "flex"
              ? "flex"
              : containerElement.layout === "grid"
                ? "grid"
                : "relative"
            : "none",
        };

        if (containerElement.layout === "flex") {
          containerStyles.flexDirection = containerElement.flexDirection;
          containerStyles.justifyContent = containerElement.justifyContent;
          containerStyles.alignItems = containerElement.alignItems;
          containerStyles.gap = containerElement.gap;
        } else if (containerElement.layout === "grid") {
          containerStyles.gridTemplateColumns =
            containerElement.gridTemplateColumns;
          containerStyles.gridTemplateRows = containerElement.gridTemplateRows;
          containerStyles.gap = containerElement.gap;
        }

        return (
          <div style={containerStyles}>
            {containerElement.children.map((child) => (
              <ElementRenderer key={child.id} element={child} />
            ))}
          </div>
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
        width: config.canvas.width,
        height: config.canvas.height,
        background: renderBackground(config.canvas.background),
        padding: config.canvas.padding.top + "px " + config.canvas.padding.right + "px " + config.canvas.padding.bottom + "px " + config.canvas.padding.left + "px",
      }}
    >
      {config.elements.map((element) => (
        <ElementRenderer key={element.id} element={element} />
      ))}
    </div>
  );
}
