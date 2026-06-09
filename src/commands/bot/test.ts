import { Channel, PermissionFlagsBits, TextChannel } from "discord.js";
import { Command } from "../../core/Command";

export default new Command({
    name: "test",
    description: "NOTHING TO SEE HERE",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    run: async (args): Promise<void> => {
        try {
            args.client.logger.dev("Test began");
            await args.interaction.reply({ content: "Test began" });
            // ======================================================================

            const recent = await args.client.steam.getUserRecentGames("76561197984509155");

            const channelID: string = args.interaction.channel?.id as string;
            const channel: Channel = args.client.channels.cache.get(channelID) as TextChannel;
            console.log(recent[0].lastPlayedAt);
            console.log(recent[0].lastPlayedTimestamp);
            //await channel.send(JSON.stringify(recent, null, 2));
            

            // ======================================================================
            await args.interaction.editReply({ content: "Test concluded successfully" });
            args.client.logger.dev("Test concluded successfully");
        } catch (error: unknown) {
            args.client.logger.dev("Test concluded in error");
            args.client.logger.dev(error as string);
            await args.interaction.editReply({ content: "Test concluded in error" });
        }
    }
});