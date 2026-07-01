import { ApplicationCommandOptionType, MessageFlags, PermissionFlagsBits } from "discord.js";
import { Command } from "../../core/Command";
import { devTestChannelId } from "../../../data/config.json";

export default new Command({
    name: "steam-update-feed",
    description: "Updates the Steam feed by an amount of previous minutes in case of bot mishap.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "minutes",
            description: "How far back to look (Default: 30).",
            type: ApplicationCommandOptionType.Integer,
            required: false
        }
    ],
    run: async (args): Promise<void> => {
        await args.interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Process options
        const minutesToLookBack: number = args.options.getInteger("minutes", false) ?? 30;

        // Determine if feature enabled for interaction's guild
        if (!args.interaction.guildId) {
            throw new Error("Required guild id is null.");
        }
        const guildId: string = args.interaction.guildId;
        const interactionChannelId: string = args.interaction.channelId;
        const isDevTestChannel: boolean = interactionChannelId === devTestChannelId;
        const isFeedEnabled: boolean = await args.client.settings.isFeatureEnabled(guildId, "steamFeed");
        if (!isDevTestChannel && !isFeedEnabled) { return; }

        // Begin the feed update, report success
        try {
            await args.client.steam.updateFeed(guildId, minutesToLookBack);
            await args.interaction.editReply({
                content: "Update successful."
            });
        } catch (error) {
            console.log(error);
            await args.interaction.editReply({ content: "Something went wrong with sending the message." });
        }
    }
});