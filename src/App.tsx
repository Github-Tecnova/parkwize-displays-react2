import React from 'react';
import './App.css';
import {ResponsiveDisplayRenderer} from "./components/responsive-display-renderer";
import {useDisplay} from "./components/providers/display-provider";
import {tecnovaClient} from "./lib/tecnova-client";
import {calculateFieldValue, formatCAD, formatCADSmall, formatDuration2} from "./lib/utils";
import ResponsiveSequenceRenderer from "./components/responsive-sequence-renderer";

function App() {
    const { config, pricePackages } = useDisplay();

    if (!config) {
        return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "black" }}>No config available</div>;
    }

    try {
        const textFormatter = (text: string): string => {
            let formattedText = text;

            if (!pricePackages || pricePackages.length === 0) {
                if (text.includes("package")) {
                    return "=====";
                }

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
                    switch (mod.type) {
                        case "BASE_PRICING:HOURLY": {
                            const hourlyMod = mod as any;
                            hourlyMod.data.Maximums.forEach((max: any) => {
                                const languages = { fr: 1, en: 2 } as const;
                                // Handle all language replacements in a loop
                                Object.entries(languages).forEach(([lang, langId]) => {
                                    formattedText = formattedText.replace(
                                        new RegExp(
                                            `\\{package\\[${pkgData.id}\\]\\.maximums\\[${max.Id}\\]\\.pricing.${lang}}`,
                                            "g",
                                        ),
                                        formatCAD(
                                            calculateFieldValue(
                                                0,
                                                max.PricingType,
                                                max.Pricing,
                                            ),
                                            lang,
                                        ),
                                    );

                                    formattedText = formattedText.replace(
                                        new RegExp(
                                            `\\{package\\[${pkgData.id}\\]\\.maximums\\[${formatDuration2(max.Minutes).toString()}\\]\\.pricing.${lang}}`,
                                            "g",
                                        ),
                                        formatCAD(
                                            calculateFieldValue(
                                                0,
                                                max.PricingType,
                                                max.Pricing,
                                            ),
                                            lang,
                                        ),
                                    );

                                    formattedText = formattedText.replace(
                                        new RegExp(
                                            `\\{package\\[${pkgData.id}\\]\\.maximums\\[${formatDuration2(max.Minutes).toString()}\\]\\.pricing-short.${lang}}`,
                                            "g",
                                        ),
                                        formatCADSmall(
                                            calculateFieldValue(
                                                0,
                                                max.PricingType,
                                                max.Pricing,
                                            ),
                                            lang,
                                        ),
                                    );
                                });

                                formattedText = formattedText.replace(
                                    new RegExp(
                                        `\\{package\\[${pkgData.id}\\]\\.maximums\\[${max.Id}\\]\\.minutes}`,
                                        "g",
                                    ),
                                    tecnovaClient().formatTime(max.Minutes),
                                );
                            });

                            hourlyMod.data.Units.forEach((unit: any) => {
                                const languages = { fr: 1, en: 2 } as const;
                                // Handle all language replacements in a loop
                                Object.entries(languages).forEach(([lang, langId]) => {
                                    formattedText = formattedText.replace(
                                        new RegExp(
                                            `\\{package\\[${pkgData.id}\\]\\.units\\[${unit.Id}\\]\\.pricing.${lang}}`,
                                            "g",
                                        ),
                                        formatCAD(
                                            calculateFieldValue(
                                                0,
                                                unit.PricingType,
                                                unit.Pricing,
                                            ),
                                            lang,
                                        ),
                                    );

                                    formattedText = formattedText.replace(
                                        new RegExp(
                                            `\\{package\\[${pkgData.id}\\]\\.units\\[${formatDuration2(unit.Minutes).toString()}\\]\\.pricing.${lang}}`,
                                            "g",
                                        ),
                                        formatCAD(
                                            calculateFieldValue(
                                                0,
                                                unit.PricingType,
                                                unit.Pricing,
                                            ),
                                            lang,
                                        ),
                                    );
                                });

                                formattedText = formattedText.replace(
                                    new RegExp(
                                        `\\{package\\[${pkgData.id}\\]\\.units\\[${unit.Id}\\]\\.minutes}`,
                                        "g",
                                    ),
                                    tecnovaClient().formatTime(unit.Minutes),
                                );
                            });
                            break;
                        }
                        case "BASE_PRICING:ENTRY": {
                            const entryMod = mod as any;
                            if (!entryMod) continue;
                            if (!entryMod.data) continue;
                            if (!Array.isArray(entryMod.data)) continue;
                            entryMod.data.forEach((row: any) => {
                                const languages = { fr: 1, en: 2 } as const;

                                Object.entries(languages).forEach(([lang, langId]) => {
                                    formattedText = formattedText.replace(
                                        new RegExp(
                                            `\\{package\\[${pkgData.id}\\]\\.entry\\[${row.id}\\]\\.pricing.${lang}}`,
                                            "g",
                                        ),
                                        formatCAD(
                                            calculateFieldValue(
                                                0,
                                                row.pricingType,
                                                row.pricing,
                                            ),
                                            lang,
                                        ),
                                    );

                                    formattedText = formattedText.replace(
                                        new RegExp(
                                            `\\{package\\[${pkgData.id}\\]\\.entry\\[${row.id}\\]\\.pricing-short.${lang}}`,
                                            "g",
                                        ),
                                        formatCADSmall(
                                            calculateFieldValue(
                                                0,
                                                row.pricingType,
                                                row.pricing,
                                            ),
                                            lang,
                                        ),
                                    );
                                });
                            });
                            break;
                        }
                        case "PACKAGE_INFORMATION": {
                            const pkgInfoMod = mod as any;

                            const languages = { fr: 1, en: 2 } as const;

                            // Handle all language replacements in a loop
                            Object.entries(languages).forEach(([lang, langId]) => {
                                formattedText = formattedText.replace(
                                    new RegExp(
                                        `\\{package\\[${pkgData.id}\\]\\.info\\.title\\.${lang}}`,
                                        "g",
                                    ),
                                    pkgInfoMod.data.title?.[
                                        lang as keyof typeof pkgInfoMod.data.title
                                        ],
                                );

                                formattedText = formattedText.replace(
                                    new RegExp(
                                        `\\{package\\[${pkgData.id}\\]\\.info\\.line1\\.${lang}}`,
                                        "g",
                                    ),
                                    pkgInfoMod.data.line1?.[
                                        lang as keyof typeof pkgInfoMod.data.line1
                                        ],
                                );

                                formattedText = formattedText.replace(
                                    new RegExp(
                                        `\\{package\\[${pkgData.id}\\]\\.info\\.line2\\.${lang}}`,
                                        "g",
                                    ),
                                    pkgInfoMod.data.line2?.[
                                        lang as keyof typeof pkgInfoMod.data.line2
                                        ],
                                );
                            });
                        }
                    }
                }
            }

            if (formattedText.includes("package")) {
                return "=====";
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