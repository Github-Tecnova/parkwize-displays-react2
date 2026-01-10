// src/types/stompjs.d.ts
declare module 'stompjs' {
    export interface Frame {
        command: string;
        headers: { [key: string]: string };
        body: string;
    }

    export interface Subscription {
        id: string;
        unsubscribe(): void;
    }

    export interface Client {
        connected: boolean;
        debug: (str: string) => void;
        connect(
            headers: { [key: string]: string },
            connectCallback: () => void,
            errorCallback?: (error: Frame | string) => void
        ): void;
        disconnect(disconnectCallback: () => void): void;
        subscribe(
            destination: string,
            callback: (message: Frame) => void,
            headers?: { [key: string]: string }
        ): Subscription;
        send(
            destination: string,
            headers?: { [key: string]: string },
            body?: string
        ): void;
    }

    export function over(ws: WebSocket): Client;
    export function client(url: string): Client;
}