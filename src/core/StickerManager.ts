import { Collection, Guild, Sticker } from "discord.js";
import { ExtendedClient } from "./ExtendedClient";

export class StickerManager {
    private clientRef: ExtendedClient;

    constructor(clientRef: ExtendedClient) {
        this.clientRef = clientRef;
    }

    // #region Helpers

    private getSlotsTotal(boostLevel: number): number {
        switch (boostLevel) {
            case 0: return 5;
            case 1: return 15;
            case 2: return 30;
            case 3: return 60;
            default: return 5;
        }
    }
    
    public async getSlotsString(guildId: string): Promise<string> {
        const guild: Guild = this.clientRef.guilds.cache.get(guildId) as Guild;
        const slots: number = this.getSlotsTotal(guild.premiumTier);
        const stickers: Collection<string, Sticker> = await guild.stickers.fetch();
        const used: number = guild.stickers.cache.size;
        const remaining: number = slots - used;

        return `Stickers: ${used} / ${slots} (${remaining} free)`;
    }
}