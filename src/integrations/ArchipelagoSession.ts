import { Client as ArchiClient, ConnectionOptions } from "archipelago.js";
import { ExtendedClient } from "../core/ExtendedClient";
import { EmbedBuilder, TextChannel } from "discord.js";

export class ArchipelagoSession {
    private clientRef: ExtendedClient;
    private channelId: string;
    private channel: TextChannel;
    private archi: ArchiClient;

    private url: string;
    private slotName: string;
    private options: ConnectionOptions | undefined;

    constructor(clientRef: ExtendedClient, channelId: string, url: string, slotName: string, options?: ConnectionOptions) {
        this.clientRef = clientRef;
        this.channelId = channelId;
        this.archi = new ArchiClient();

        this.url = url;
        this.slotName = slotName;
        this.options = options;

        this.channel = this.clientRef.channels.cache.get(this.channelId) as TextChannel;
    }

    private async setEventHandlers(): Promise<void> {
        this.archi.messages.on("message", async (content) => {
            const embed: EmbedBuilder = new EmbedBuilder()
                .setDescription(content);
            await this.channel.send({
                embeds: [ embed ]
            });
        });
    }

    public async connect(): Promise<void> {
        this.archi = new ArchiClient();
        try{
            this.archi.login(this.url, this.slotName, "", this.options);
            this.setEventHandlers();
        } catch(error: unknown) {
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        this.archi?.socket.disconnect();
    }
}