import { EmbedBuilder, Events, GuildEmoji, TextChannel } from "discord.js";
import { Event } from "../core/Event";
import { client } from "..";

export default new Event(
    Events.GuildEmojiUpdate,
    async (oldEmote: GuildEmoji, newEmote: GuildEmoji) => {
        // Determine if emote logs are enabled in guild
        const guildId: string = newEmote.guild.id;
        const isFeedEnabled: boolean = await client.settings.isFeatureEnabled(guildId, "emoteFeed");
        if (!isFeedEnabled) return;

        // Create embed
        const slotsString: string = await client.expressions.emotes.getSlotsString(guildId);
        const embed: EmbedBuilder = new EmbedBuilder()
            .setColor("#000000")
            .setTitle(`Renamed :${newEmote.name}:`)
            .setThumbnail((newEmote.animated) ? newEmote.imageURL({ extension: "gif" }) : newEmote.imageURL())
            .setDescription(`Previously :${oldEmote.name}:\n\n${slotsString}`);

        // Send message to relevant channel
        const channelId: string = await client.settings.getChannelId(guildId, "emoteFeed");
        const channel: TextChannel = client.channels.cache.get(channelId) as TextChannel;
        await channel.send({ embeds: [ embed ] });
    }
);