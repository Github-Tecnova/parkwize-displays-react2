import React, { Component } from "react";
import { Client, IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { EnhancedDisplayConfig, PriceGroupType, SavedDisplayType } from "@evovee/tecnova-types";
import tecnova from "../../lib/tecnova";

type DisplayContextType = {
    config: EnhancedDisplayConfig | undefined;
    priceGroup: PriceGroupType | undefined;
}

export const DisplayContext = React.createContext<DisplayContextType | undefined>(undefined);

var WEBSOCKET_URL = "https://api.parkwizeinc.com/ws";

type DisplayProviderState = {
    display: SavedDisplayType | undefined;
}

type DisplayProviderProps = {
    children: React.ReactNode;
}

export class DisplayProvider extends Component<DisplayProviderProps, DisplayProviderState> {
    private stompClient: Client | null = null;
    private orgId: string;
    private parkingId: string;
    private kioskId: string;

    constructor(props: DisplayProviderProps) {
        super(props);
        this.state = {
            display: undefined
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
        tecnova.fetchCurrentKioskDisplay(this.orgId, this.parkingId, this.kioskId)
            .then(function(response) {
                if (response.data) {
                    self.setState({ display: response.data as SavedDisplayType | undefined });
                }
            })
            .catch(function(error: Error) {
                console.error("Error refetching display:", error);
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
        var display = this.state.display;
        var contextValue: DisplayContextType = {
            config: display ? display.config : undefined,
            priceGroup: display ? display.PriceGroup : undefined
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