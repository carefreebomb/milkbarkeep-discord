import { ApplicationCommandOptionType, Attachment, EmbedBuilder, MessageFlags, PermissionFlagsBits } from "discord.js";
import { Command } from "../../core/Command";
import { EmoteOperation } from "../../types/AppTypes";

export default new Command({
    name: "emote-upload",
    description: "Add a new emote to this server.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "name",
            description: "The name to be used.",
            type: ApplicationCommandOptionType.String,
            required: true
        }, {
            name: "image",
            description: "The image to be uploaded.",
            type: ApplicationCommandOptionType.Attachment,
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

        // Check inputs
        const emoteName: string = args.options.getString("name", true) as string;
        const attachment = args.options.getAttachment("image", true) as Attachment;
        if (!attachment.contentType?.startsWith("image/")) {
            await args.interaction.editReply({ content: "Only image files can be uploaded as emotes." });
            return;
        }

        // Upload emote to guild
        const op: EmoteOperation = await args.client.expressions.emotes.upload(guildId, emoteName, attachment.url);

        // Send results
        if (!op.success) {
            args.interaction.editReply({ content: op.response });
        } else {
            const embed: EmbedBuilder = new EmbedBuilder()
                .setColor("#000000")
                .setTitle(`Added :${emoteName}:`)
                .setThumbnail(attachment.url)
                .setDescription(op.response);
            args.interaction.editReply({ embeds: [ embed ] })
        }
    }
});