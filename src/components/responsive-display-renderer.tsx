
import React from "react";
import { DisplayRenderer } from "./display-renderer";
import { EnhancedDisplayConfig } from "@evovee/tecnova-types";

interface ResponsiveDisplayRendererProps {
    config: EnhancedDisplayConfig;
    fit?: "contain" | "cover" | "fill";
    containerStyle?: React.CSSProperties;
    minScale?: number;
    textFormatter: (text: string) => string;
}

export function ResponsiveDisplayRenderer({config, fit = "contain", containerStyle, textFormatter}: ResponsiveDisplayRendererProps) {
    return (
        <div
            style={{
                overflow: "hidden",
                // Container sizes itself to the scaled display
                width: fit === "fill" ? "100%" : 1080 + "px",
                height: fit === "fill" ? "100%" : 1920 + "px",
                minWidth: fit === "contain" ? "auto" : undefined,
                minHeight: fit === "contain" ? "auto" : undefined,
                ...containerStyle,
            }}
        >
            <div
                style={{
                    transform: "scale(" + 1 + ")",
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
