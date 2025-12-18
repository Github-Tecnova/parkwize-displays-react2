"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {EnhancedDisplayConfig, PriceGroupType, SavedDisplayType} from "@evovee/tecnova-types";
import tecnova from "../../lib/tecnova";

type DisplayContextType = {
    config: EnhancedDisplayConfig | undefined;
    priceGroup: PriceGroupType | undefined;
}

export const DisplayContext = React.createContext<DisplayContextType | undefined>(undefined);

const WEBSOCKET_URL = "wss://events-core-api.onrender.com/ws";
const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function DisplayProvider({
                                    children,
                                }: {
    children: React.ReactNode
}) {
    const [display, setDisplay] = useState<SavedDisplayType>();

    const orgId = new URLSearchParams(window.location.search).get('orgId') || "0b22a7d7-08f6-4ae8-804c-7b58c0def7c5";
    const parkingId = new URLSearchParams(window.location.search).get('parkingId') || "36201249-9e37-4888-887f-d3ebb30d8d38";
    const kioskId = new URLSearchParams(window.location.search).get('kioskId') || "127";

    const routeInfo = {
        orgId: orgId,
        parkingId: parkingId,
        kioskId: kioskId
    };

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const subscriptionTopicRef = useRef<string>("");

    // Simple refetch function
    const refetchDisplay = useCallback(async () => {
        try {

            const { data } = await tecnova.fetchCurrentKioskDisplay(orgId, parkingId, kioskId);
            if (data) {
                setDisplay(data as SavedDisplayType);
            }
        } catch (error) {
            console.error("Error refetching display:", error);
        }
    }, [routeInfo]);

    // Parse STOMP frame
    const parseStompFrame = (data: string): { command: string; headers: Record<string, string>; body: string } | null => {
        try {
            const lines = data.split('\n');
            const command = lines[0];
            const headers: Record<string, string> = {};
            let bodyStartIndex = 0;

            for (let i = 1; i < lines.length; i++) {
                if (lines[i] === '') {
                    bodyStartIndex = i + 1;
                    break;
                }
                const [key, value] = lines[i].split(':');
                if (key) headers[key] = value || '';
            }

            const body = lines.slice(bodyStartIndex).join('\n').replace(/\0$/, '');
            return { command, headers, body };
        } catch (error) {
            console.error("Error parsing STOMP frame:", error);
            return null;
        }
    };

    // Create STOMP frame
    const createStompFrame = (command: string, headers: Record<string, string> = {}, body: string = ''): string => {
        let frame = `${command}\n`;
        Object.entries(headers).forEach(([key, value]) => {
            frame += `${key}:${value}\n`;
        });
        frame += '\n' + body + '\0';
        return frame;
    };

    // Connect WebSocket
    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const ws = new WebSocket(WEBSOCKET_URL);

            ws.onopen = () => {
                console.log("WebSocket connected");
                reconnectAttemptsRef.current = 0;

                // Send STOMP CONNECT frame
                const connectFrame = createStompFrame('CONNECT', {
                    'accept-version': '1.0,1.1,1.2',
                    'host': 'events-core-api.onrender.com',
                    'login': 'guest',
                    'passcode': 'guest'
                });
                ws.send(connectFrame);
            };

            ws.onmessage = (event) => {
                const frame = parseStompFrame(event.data);

                if (frame?.command === 'CONNECTED') {
                    console.log("STOMP connected, subscribing to display updates");

                    // Subscribe to display topic
                    subscriptionTopicRef.current = `/topic/displays/${routeInfo.orgId}/${routeInfo.parkingId}${routeInfo.kioskId ? `/${routeInfo.kioskId}` : ''}`;
                    const subscribeFrame = createStompFrame('SUBSCRIBE', {
                        'id': `sub-${Date.now()}`,
                        'destination': subscriptionTopicRef.current
                    });
                    ws.send(subscribeFrame);
                } else if (frame?.command === 'MESSAGE') {
                    console.log("Display update received");
                    refetchDisplay();
                } else if (frame?.command === 'ERROR') {
                    console.error("STOMP error:", frame.body);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            ws.onclose = () => {
                console.log("WebSocket disconnected");

                // Attempt reconnection with exponential backoff
                if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current += 1;
                    const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current - 1);
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, delay);
                } else {
                    console.error("Max reconnection attempts reached");
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error("Error creating WebSocket:", error);
        }
    }, [routeInfo.orgId, routeInfo.parkingId, routeInfo.kioskId, refetchDisplay]);

    // Setup WebSocket connection
    useEffect(() => {
        connectWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connectWebSocket]);

    return (
        <DisplayContext.Provider value={{
            config: display?.config,
            priceGroup: display?.PriceGroup
        }}>
            {children}
        </DisplayContext.Provider>
    )
}

export function useDisplay() {
    const context = React.useContext(DisplayContext);
    if (!context) {
        throw new Error("useDisplay must be used within a DisplayProvider");
    }
    return context;
}