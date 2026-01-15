import React from 'react';
import './App.css';
import {ResponsiveDisplayRenderer} from "./components/responsive-display-renderer";
import {useDisplay} from "./components/providers/display-provider";
import {tecnovaClient} from "./lib/tecnova-client";
import {calculateFieldValue, formatCAD} from "./lib/utils";
import ResponsiveSequenceRenderer from "./components/responsive-sequence-renderer";

function App() {
    const { config, pricePackages, occupancy } = useDisplay();

    if (!config) {
        return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "black" }}>No config available</div>;
    }

    try {
        const textFormatter = (text: string): string => {
            let formattedText = text;

            if (!pricePackages || pricePackages.length === 0) {
                console.log("No price found");
                return formattedText;
            }

            const prices = pricePackages.map((p, i) => ({
                ...p,
                data: { ...p.data, id: i + 1 },
            }));

            for (let i = 0; i < prices.length; i++) {
                const pkg = prices[i];
                for (const mod of pkg.data.modules) {
                    const pkgData = pkg.data;
                    switch (mod.type as "BASE_PRICING:HOURLY" | "BASE_PRICING:ENTRY" | "PACKAGE_INFORMATION") {
                        case "BASE_PRICING:HOURLY": {
                            const hourlyMod = mod as any;
                            hourlyMod.data.Maximums.forEach((max: any) => {
                                formattedText = formattedText.replace(
                                    new RegExp(
                                        `\\{package\\[${pkgData.id}\\]\\.maximums\\[${max.Id}\\]\\.minutes}`,
                                        "g",
                                    ),
                                    tecnovaClient().formatTime(max.Minutes),
                                );

                                formattedText = formattedText.replace(
                                    new RegExp(
                                        `\\{package\\[${pkgData.id}\\]\\.maximums\\[${max.Id}\\]\\.pricing}`,
                                        "g",
                                    ),
                                    formatCAD(
                                        calculateFieldValue(occupancy, max.PricingType, max.Pricing),
                                    ),
                                );
                            });
                            break;
                        }
                        case "BASE_PRICING:ENTRY": {
                            const entryMod = mod as any;
                            break;
                        }
                        case "PACKAGE_INFORMATION": {
                            const pkgInfoMod = mod as any;
                            break;
                        }
                    }
                }
            }

            console.log("formattedText: ", formattedText);
            return formattedText;
        }

        return (
            <div style={{ background: 'red', height: "fit-content", width: "fit-content" }}>
                {Array.isArray(config) ? (
                    <ResponsiveSequenceRenderer config={config} textFormatter={textFormatter} containerStyle={{width: "100%", height: "100%"}} />
                ) : (
                    <ResponsiveDisplayRenderer config={config} textFormatter={textFormatter} containerStyle={{ width: "100%", height: "100%" }} />
                )}
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