import { ApplicationCommandOptionType, EmbedBuilder, MessageFlags, PermissionFlagsBits } from "discord.js";
import { Command } from "../../core/Command";
import type { EmoteInfo, EmoteOperation } from "../../types/AppTypes";

export default new Command({
    name: "emote-delete",
    description: "Upload an emote from this server.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "emote",
            description: "The emote to be deleted from this server.",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    run: async (args): Promise<void> => {
        // Ensure there won't be a double posting of the embeds in the feed channel
        const guildId: string = args.interaction.guildId as string;
        const feedChannelId: string = await args.client.settings.getChannelId(guildId, "emoteFeed");
        if (args.interaction.channelId === feedChannelId) {
            await args.interaction.deferReply({ flags: MessageFlags.Ephemeral });
        } else {
            await args.interaction.deferReply();
        }

        // Check input
        const emoteString: string = args.options.getString("emote", true).replace(/\+/g, "");
        const isEmote: boolean = args.client.expressions.emotes.isEmote(emoteString);
        if (!isEmote) {
            await args.interaction.editReply({ content: "Please use a valid emote." });
            return;
        }

        // Extract emote id
        const emote: EmoteInfo = args.client.expressions.emotes.emoteInfoFromString(emoteString);

        // Delete emote from guild
        const op: EmoteOperation = await args.client.expressions.emotes.delete(guildId, emote.id);
        
        // Send results
        if (!op.success) {
            args.interaction.editReply({ content: op.response });
        } else {
            const embed: EmbedBuilder = new EmbedBuilder()
                .setColor("#000000")
                .setTitle(`Deleted :${emote.name}:`)
                .setThumbnail(emote.cdnUrl)
                .setDescription(op.response);
            args.interaction.editReply({ embeds: [ embed ] })
        }
    }
});