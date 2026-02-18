import { EmbedBuilder, Events, Guild, Sticker, TextChannel } from "discord.js";
import { Event } from "../core/Event";
import { client } from "..";

export default new Event(
    Events.GuildStickerCreate,
    async (sticker: Sticker) => {
        // Determine if emote logs are enabled in guild
        const guildId: string = sticker.guildId ?? "";
        const isFeedEnabled: boolean = await client.settings.isFeatureEnabled(guildId, "emoteFeed");
        if (!isFeedEnabled) return;

        // Create embed
        const slotsString: string = await client.expressions.stickers.getSlotsString(guildId);
        const embed: EmbedBuilder = new EmbedBuilder()
            .setColor("#000000")
            .setTitle(`Added :${sticker.name}:`)
            .setThumbnail(sticker.url)
            .setDescription(slotsString);

        // Send message to relevant channel
        const channelId: string = await client.settings.getChannelId(guildId, "emoteFeed");
        const channel: TextChannel = client.channels.cache.get(channelId) as TextChannel;
        await channel.send({ embeds: [ embed ] });
    }
);