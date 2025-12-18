import React, {useEffect, useState} from 'react';
import './App.css';
import {SavedDisplayType} from "@evovee/tecnova-types";
import tecnova from "./lib/tecnova";
import {tecnovaClient} from "./lib/tecnova-client";
import {ResponsiveDisplayRenderer} from "./components/responsive-display-renderer";

function App() {
    const [initialDisplay, setInitialDisplay] = useState<SavedDisplayType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialDisplay = async () => {
            try {
                setLoading(true);
                // Get route info from URL params or environment
                const orgId = new URLSearchParams(window.location.search).get('orgId') || "0b22a7d7-08f6-4ae8-804c-7b58c0def7c5";
                const parkingId = new URLSearchParams(window.location.search).get('parkingId') || "36201249-9e37-4888-887f-d3ebb30d8d38";
                const kioskId = new URLSearchParams(window.location.search).get('kioskId') || "127";

                const { data } = await tecnova.fetchCurrentKioskDisplay(orgId, parkingId, kioskId);
                setInitialDisplay(data as SavedDisplayType);
            } catch (err) {
                console.error("Error fetching initial display:", err);
                setError("Failed to load display");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialDisplay();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (error || !initialDisplay) {
        return <div className="flex items-center justify-center min-h-screen text-red-500">{error || "No display data"}</div>;
    }

    console.log(initialDisplay);

    const priceGroup = initialDisplay.PriceGroup;
    const config = initialDisplay.config;

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
