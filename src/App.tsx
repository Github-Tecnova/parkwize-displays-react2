import React, {useEffect, useState} from 'react';
import './App.css';
import {tecnovaClient} from "./lib/tecnova-client";
import {ResponsiveDisplayRenderer} from "./components/responsive-display-renderer";
import {useDisplay} from "./components/provider/display-provider";

function App() {
    const { config, priceGroup } = useDisplay();

    if (!config) {
        return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "black" }}>No config available</div>;
    }

    try {
        const textFormatter = (text: string): string => {
            if (!priceGroup) {
                return text;
            }

            try {
                switch (priceGroup.priceType) {
                    case "FIXED":
                        return tecnovaClient().formatDisplayTextFixed(text, {
                            id: priceGroup.id,
                            priceType: priceGroup.priceType,
                            priceName: priceGroup.priceName,
                            data: priceGroup.data,
                        });
                    case "MINUTE":
                        return tecnovaClient().formatDisplayTextMinute(text, {
                            id: priceGroup.id,
                            priceType: priceGroup.priceType,
                            priceName: priceGroup.priceName,
                            data: priceGroup.data,
                        });
                    case "PACKAGE":
                        return tecnovaClient().formatDisplayTextPackage(text, {
                            id: priceGroup.id,
                            priceType: priceGroup.priceType,
                            priceName: priceGroup.priceName,
                            data: priceGroup.data,
                        });
                }
            } catch (err) {
                console.error("Error in textFormatter:", err);
            }

            return text;
        }

        return (
            /*<AutoScalingDisplayRendere
                config={config}
                textFormatter={textFormatter}
                fit={"fill"}
                containerStyle={{ maxHeight: "50vh", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
            />*/
            <div style={{ background: 'red', height: "fit-content", width: "fit-content" }}>
                <ResponsiveDisplayRenderer config={config} textFormatter={textFormatter} containerStyle={{ width: "100%", height: "100%" }} />
            </div>
        );
    } catch (error) {
        console.error("Error in TvPage render:", error);
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#fef2f2" }}>
                <div style={{ textAlign: "center" }}>
                    <h1 style={{ fontSize: "1.5rem", lineHeight: "2rem", fontWeight: "700", color: "black", marginBottom: "1rem" }}>Error rendering display</h1>
                    <p style={{ color: "black" }}>{error instanceof Error ? error.message : String(error)}</p>
                </div>
            </div>
        );
    }
}

export default App;
