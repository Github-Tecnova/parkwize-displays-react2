
import React, { Component } from "react";
import { EnhancedDisplayConfig, PriceGroupType, SavedDisplayType } from "@evovee/tecnova-types";
import tecnova from "../../lib/tecnova";
import Stomp from "stompjs";

type DisplayContextType = {
    config: EnhancedDisplayConfig | undefined;
    priceGroup: PriceGroupType | undefined;
}

export const DisplayContext = React.createContext<DisplayContextType | undefined>(undefined);

const WEBSOCKET_URL = "wss://api.parkwizeinc.com/ws";
const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

type DisplayProviderState = {
    display: SavedDisplayType | undefined;
}

type DisplayProviderProps = {
    children: React.ReactNode;
}

export class DisplayProvider extends Component<DisplayProviderProps, DisplayProviderState> {
    private stompClient: Stomp.Client | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private reconnectAttempts: number = 0;
    private orgId: string;
    private parkingId: string;
    private kioskId: string;

    constructor(props: DisplayProviderProps) {
        super(props);
        this.state = {
            display: undefined
        };

        const params = new URLSearchParams(window.location.search);
        this.orgId = params.get('orgId') || "0b22a7d7-08f6-4ae8-804c-7b58c0def7c5";
        this.parkingId = params.get('parkingId') || "36201249-9e37-4888-887f-d3ebb30d8d38";
        this.kioskId = params.get('kioskId') || "127";
    }

    componentDidMount() {
        this.connectWebSocket();
    }

    componentWillUnmount() {
        this.disconnect();
    }

    private disconnect = () => {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.stompClient && this.stompClient.connected) {
            try {
                this.stompClient.disconnect(function() {
                    console.log("STOMP disconnected");
                });
            } catch (error) {
                console.error("Error disconnecting STOMP:", error);
            }
        }
        this.stompClient = null;
    };

    private refetchDisplay = () => {
        var self = this;
        tecnova.fetchCurrentKioskDisplay(this.orgId, this.parkingId, this.kioskId)
            .then(function(response) {
                if (response.data) {
                    self.setState({ display: response.data as SavedDisplayType });
                }
            })
            .catch(function(error) {
                console.error("Error refetching display:", error);
            });
    };

    private scheduleReconnect = () => {
        var self = this;
        if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts += 1;
            var delay = RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts - 1);
            console.log("Reconnecting in " + delay + "ms (attempt " + this.reconnectAttempts + ")");

            this.reconnectTimeout = setTimeout(function() {
                self.connectWebSocket();
            }, delay);
        } else {
            console.error("Max reconnection attempts reached");
        }
    };

    private connectWebSocket = () => {
        var self = this;

        if (this.stompClient && this.stompClient.connected) {
            return;
        }

        try {
            var ws = new WebSocket(WEBSOCKET_URL);
            this.stompClient = Stomp.over(ws);

            // Disable debug logging in production
            this.stompClient.debug = function(str: string) {
                console.log(str);
            };

            var connectHeaders = {
                'host': 'api.parkwizeinc.com'
            };

            this.stompClient.connect(
                connectHeaders,
                function onConnect() {
                    console.log("STOMP connected");
                    self.reconnectAttempts = 0;

                    var topic = "/topic/displays/" + self.orgId + "/" + self.parkingId +
                        (self.kioskId ? "/" + self.kioskId : "");

                    if (self.stompClient) {
                        self.stompClient.subscribe(topic, function(message) {
                            console.log("Display update received");
                            self.refetchDisplay();
                        });
                    }
                },
                function onError(error: Stomp.Frame | string) {
                    console.error("STOMP error:", error);
                    self.stompClient = null;
                    self.scheduleReconnect();
                }
            );

            // Handle WebSocket close for reconnection
            ws.onclose = function() {
                console.log("WebSocket disconnected");
                if (self.stompClient) {
                    self.stompClient = null;
                    self.scheduleReconnect();
                }
            };

        } catch (error) {
            console.error("Error creating WebSocket:", error);
            this.scheduleReconnect();
        }
    };

    render() {
        var contextValue: DisplayContextType = {
            config: this.state.display ? this.state.display.config : undefined,
            priceGroup: this.state.display ? this.state.display.PriceGroup : undefined
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