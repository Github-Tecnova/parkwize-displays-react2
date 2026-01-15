
import React, { useEffect, useMemo, useState } from "react";
import { DisplayRenderer } from "./display-renderer";
import { EnhancedSequenceConfig } from "@evovee/tecnova-types";

// Define the frame type based on what's being used
interface SequenceFrame {
    duration: number;
    display: {
        config: any;
    };
}

interface SequenceRendererProps {
    config: SequenceFrame[];
    className?: string;
    autoPlay?: boolean;
    loop?: boolean;
    initialIndex?: number;
    onFrameChange?: (frame: SequenceFrame, index: number) => void;
    textFormatter: (text: string) => string;
}

/**
 * Renders a sequence of displays based on durations in the EnhancedSequenceConfig.
 * By default, it autoplays through frames using each frame's duration (in seconds).
 */
export function SequenceRenderer({
                                     config,
                                     className,
                                     autoPlay = true,
                                     loop = true,
                                     initialIndex = 0,
                                     onFrameChange,
                                     textFormatter,
                                 }: SequenceRendererProps) {
    const frames = useMemo(() => config ?? [], [config]);
    const [currentIdx, setCurrentIdx] = useState(initialIndex);

    useEffect(() => {
        if (!autoPlay || frames.length === 0) return;

        const rotationInterval = setInterval(() => {
            setCurrentIdx((prevIdx) => {
                const nextIdx = prevIdx + 1;
                if (nextIdx >= frames.length) {
                    return loop ? 0 : prevIdx;
                }
                return nextIdx;
            });
        }, Math.max(1000, frames[currentIdx]?.duration * 1000 || 1000));

        return () => clearInterval(rotationInterval);
    }, [frames, currentIdx, autoPlay, loop]);

    useEffect(() => {
        if (frames.length > 0 && onFrameChange) {
            onFrameChange(frames[currentIdx], currentIdx);
        }
    }, [currentIdx, frames, onFrameChange]);

    // Guard: nothing to render
    if (!frames || frames.length === 0) {
        return <div>No frames</div>;
    }

    const frame = frames[currentIdx];

    return (
        <div className={className}>
            {frames.map((_, idx) =>
                idx === currentIdx ? (
                    <div key={idx}>
                        <DisplayRenderer
                            config={frame.display.config}
                            textFormatter={textFormatter}
                        />
                    </div>
                ) : null
            )}
        </div>
    );
}

export default SequenceRenderer;