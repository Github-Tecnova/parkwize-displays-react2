import React from 'react'
import SequenceRenderer from "./sequence-renderer";
import {DisplayRenderer} from "./display-renderer";

interface Props {
    config: any;
    fit?: "contain" | "cover" | "fill";
    textFormatter: (text: string) => string;
    minScale?: number;
    maxScale?: number;
    containerStyle?: React.CSSProperties;
}

export default function ResponsiveSequenceRenderer({config, containerStyle, fit, textFormatter}: Props) {
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
                    width: "1080px",
                    height: "1920px",
                }}
            >
                <SequenceRenderer config={config} textFormatter={textFormatter} />
            </div>
        </div>
    )
}
