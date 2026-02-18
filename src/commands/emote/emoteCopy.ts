import { ApplicationCommandOptionType, EmbedBuilder, Message, MessageFlags, PermissionFlagsBits } from "discord.js";
import { Command } from "../../core/Command";
import type { EmoteInfo, EmoteOperation } from "../../types/AppTypes";

export default new Command({
    name: "emote-copy",
    description: "Copy an emote from another server.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "source",
            description: "The Discord emote or Id of message containing one.",
            type: ApplicationCommandOptionType.String,
            required: true
        }, {
            name: "rename",
            description: "An optional new name",
            type: ApplicationCommandOptionType.String,
            required: false
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
        const sourceArg: string = args.options.getString("source", true);
        const renameArg: string | null = args.options.getString("rename", false);
        const isPossibleMessage: boolean = args.client.messageHandler.isPossibleMessageId(sourceArg);
        const isEmote: boolean = args.client.expressions.emotes.isEmote(sourceArg);

        // Process next step based on results
        let content: string = "";
        if (isEmote) {
            content = sourceArg.replace(/\+/g, "");
        } else if (isPossibleMessage) {
            const message: Message | undefined = await args.client.messageHandler.getMessage(guildId, sourceArg, args.interaction.channel?.id);
            if (message === undefined) {
                await args.interaction.editReply({ content: "Please use a valid emote or message Id." });
                return;
            } else {
                content = message.content;
            }
        } else {
            await args.interaction.editReply({ content: "Please use a valid emote or message Id." });
            return;
        }

        // Extract emote id and whether it is animated from the string
        const emote: EmoteInfo = args.client.expressions.emotes.emoteInfoFromString(content, renameArg ?? undefined);

        // Get the image file as a buffer
        let buffer: Buffer;
        try {
            const response: Response = await fetch(emote.cdnUrl);
            if (!response.ok) { throw new Error(`Failed to fetch emoji: ${response.statusText}`); }
            buffer = Buffer.from(await response.arrayBuffer());
        } catch(error: unknown) {
            args.client.logger.err(error as string);
            await args.interaction.editReply({ content: "There was an issue with copying the emote image." });
            return;
        }

        // Upload image to the guild
        const op: EmoteOperation = await args.client.expressions.emotes.upload(guildId, emote.name, buffer);
        
        // Send results
        if (!op.success) {
            args.interaction.editReply({ content: op.response });
        } else {
            const embed: EmbedBuilder = new EmbedBuilder()
                .setColor("#000000")
                .setTitle(`Copied :${emote.name}:`)
                .setThumbnail(emote.cdnUrl)
                .setDescription(op.response);
            args.interaction.editReply({ embeds: [ embed ] })
        }
    }
});