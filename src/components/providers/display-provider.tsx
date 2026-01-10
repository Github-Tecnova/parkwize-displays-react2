
import React, { Component } from "react";
import { Client, IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {EnhancedDisplayConfig, EnhancedSequenceConfig} from "@evovee/tecnova-types";

type DisplayContextType = {
    config: EnhancedDisplayConfig | EnhancedSequenceConfig | undefined;
    pricePackages: any[];
    occupancy: number;
}

export const DisplayContext = React.createContext<DisplayContextType | undefined>(undefined);

var WEBSOCKET_URL = "https://api.parkwizeinc.com/ws";

type DisplayProviderState = {
    config: EnhancedDisplayConfig | EnhancedSequenceConfig | undefined;
    pricePackages: any[];
    occupancy: number;
}

type DisplayProviderProps = {
    children: React.ReactNode;
}

export class DisplayProvider extends Component<DisplayProviderProps, DisplayProviderState> {
    private stompClient: Client | null = null;
    private readonly orgId: string;
    private readonly parkingId: string;
    private readonly kioskId: string;

    constructor(props: DisplayProviderProps) {
        super(props);
        this.state = {
            config: undefined,
            pricePackages: [],
            occupancy: 0,
        };

        var params = new URLSearchParams(window.location.search);
        this.orgId = params.get('orgId') || "0b22a7d7-08f6-4ae8-804c-7b58c0def7c5";
        this.parkingId = params.get('parkingId') || "36201249-9e37-4888-887f-d3ebb30d8d38";
        this.kioskId = params.get('kioskId') || "127";
    }

    componentDidMount(): void {
        // Fetch initial display data
        this.refetchDisplay();
        // Then setup WebSocket for updates
        this.connectWebSocket();
    }

    componentWillUnmount(): void {
        this.disconnect();
    }

    private disconnect = (): void => {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = null;
        }
    };

    private refetchDisplay = (): void => {
        var self = this;

        fetch(`https://www.parkwizeinc.com/api/v1/organization/${this.orgId}/parkings/${this.parkingId}/kiosks/${this.kioskId}/display`, {
            method: "GET",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.REACT_APP_DISPLAY_API_KEY || ""
            },
        }).then((response) => response.json()).then((data) => {
            self.setState({ config: data.config, pricePackages: data.pricePackages, occupancy: data.occupancy })
        });
    };

    private connectWebSocket = (): void => {
        var self = this;

        var topic = "/topic/displays/" + this.orgId + "/" + this.parkingId +
            (this.kioskId ? "/" + this.kioskId : "");

        this.stompClient = new Client({
            webSocketFactory: function() {
                return new SockJS(WEBSOCKET_URL) as WebSocket;
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: function(_str: string) {
                // Uncomment below for debugging
                // console.log(_str);
            },
            onConnect: function() {
                console.log("STOMP connected");

                if (self.stompClient) {
                    self.stompClient.subscribe(topic, function(message) {
                        console.log("Display update received:", message.body);
                        self.refetchDisplay();
                    });
                }
            },
            onDisconnect: function() {
                console.log("STOMP disconnected");
            },
            onStompError: function(frame: IFrame) {
                console.error("STOMP error:", frame.headers['message']);
                console.error("Details:", frame.body);
            },
            onWebSocketError: function(event: Event) {
                console.error("WebSocket error:", event);
            }
        });

        this.stompClient.activate();
    };

    render(): React.ReactNode {
        var config = this.state.config;
        var contextValue: DisplayContextType = {
            config: config,
            pricePackages: this.state.pricePackages,
            occupancy: this.state.occupancy
        };

        return (
            <DisplayContext.Provider value={contextValue}>
                {this.props.children}
            </DisplayContext.Provider>
        );
    }
}

export function useDisplay(): DisplayContextType {
    var context = React.useContext(DisplayContext);
    if (!context) {
        throw new Error("useDisplay must be used within a DisplayProvider");
    }
    return context;
}
