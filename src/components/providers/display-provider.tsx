import React, { Component } from "react";
import { Client, IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type DisplayContextType = {
    config: any[];
    occupancy: number;
}

export const DisplayContext = React.createContext<DisplayContextType | undefined>(undefined);

var WEBSOCKET_URL = process.env.REACT_APP_NODE_ENV === 'production' ? "https://api.parkwizeinc.com/ws" : 'http://localhost:3002/ws';

type DisplayProviderState = {
    config: any[];
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
            config: [],
            occupancy: 0,
        };

        var params = new URLSearchParams(window.location.search);
        this.orgId = params.get('orgId') || "";
        this.parkingId = params.get('parkingId') || "";
        this.kioskId = params.get('kioskId') || "";
    }

    componentDidMount(): void {
        console.log("DisplayProvider mounted");
        this.refetchDisplay();
        this.connectWebSocket();
    }

    componentWillUnmount(): void {
        console.log("DisplayProvider unmounted");
        this.disconnect();
    }

    private disconnect = async (): Promise<void> => {
        console.log("Calling STOMP deactivate");

        const client = this.stompClient;
        this.stompClient = null;

        if (client) {
            await client.deactivate();
            console.log("STOMP deactivated");
        }
    };

    private refetchDisplay = (): void => {
        var self = this;

        const url = process.env.REACT_APP_NODE_ENV === "production" ? `https://api.parkwize.ai/open/display-api/${this.orgId}/${this.kioskId}` : `http://localhost:3002/open/display-api/${this.orgId}/${this.kioskId}`;

        console.log("using: ", url);

        fetch(url, {
            method: "GET",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.REACT_APP_PUBLIC_KEY + "." + process.env.REACT_APP_PRIVATE_KEY
            },
        }).then(async (response) => await response.json()).then((data) => {
            console.log("Display data:", data);
            self.setState({ config: data.design.config, occupancy: data.occupancy })
        }).catch((error) => {
            console.error("Error fetching display:", error);
        });
    };

    private connectWebSocket = (): void => {
        if (this.stompClient) {
            console.log("STOMP client already exists; skipping connection");
            return;
        }

        var self = this;
        var topic = "/topic/displays/" + this.orgId + "/" + this.kioskId;

        this.stompClient = new Client({
            webSocketFactory: function() {
                return new SockJS(WEBSOCKET_URL) as WebSocket;
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 0,
            heartbeatOutgoing: 0,
            connectionTimeout: 10000,
            debug: function(_str: string) {
                // Uncomment below for debugging
                console.log(_str);
            },
            onConnect: function() {
                console.log("STOMP connected");

                if (self.stompClient) {
                    self.stompClient.subscribe(topic, function(message) {
                        console.log("Display update received:", message.body);
                        self.refetchDisplay();
                    });

                    self.stompClient.subscribe("/topic/occupancy/" + self.orgId + "/" + self.parkingId, function(message) {
                        console.log("Occupancy update received:", message.body);
                        const {occupancy}: { occupancy: number } = JSON.parse(message.body);
                        self.setState({ ...self.state, occupancy: occupancy });
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
            onWebSocketClose: function(event: Event) {
                console.log("WebSocket closed:", event);
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
