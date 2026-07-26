import { ArgumentError, ConnectionOptions, LoginError } from "archipelago.js";
import { ExtendedClient } from "../core/ExtendedClient";
import { ArchipelagoSession } from "./ArchipelagoSession";

export class ArchipelagoManager {
    private clientRef: ExtendedClient;
    private sessions: Map<string, ArchipelagoSession> = new Map<string, ArchipelagoSession>();

    constructor(clientRef: ExtendedClient) {
        this.clientRef = clientRef;
    }

    public async createSession(channelId: string, url: string, slotName: string, options?: ConnectionOptions): Promise<string> {
        if (this.sessions.has(channelId)) { return "This channel already contains a connection to an Archipelago game server."; }

        const session = new ArchipelagoSession(this.clientRef, channelId, url, slotName, options);
        try {
            session.connect();

            this.sessions.set(channelId, session);
            return `Successfully connected to ${url}`;
        } catch(error: unknown) {
            if (error instanceof  LoginError) {
                return `The server refused the authentication attempt: ${error.message}`;
            } else if (error instanceof TypeError) {
                return `Provided URL may be malformed or of an invalid protocol: ${error.message}`
            } else if (error instanceof ArgumentError) {
                return `The slot name is empty: ${error.message}`;
            } else {
                return `There was an error connecting to the server: ${error as string}`;
            }
        }   
    }

    public async destroySession(channelId: string): Promise<string> {
        if (this.sessions.has(channelId)) {
            const session: ArchipelagoSession = this.sessions.get(channelId) as ArchipelagoSession;
            session.disconnect();
            this.sessions.delete(channelId);
            return "Sucessfully disconnected from Archipelago game server."
        } else {
            return "This channel does not currently contain a connection to an Archipelago game server.";
        }
    }
}