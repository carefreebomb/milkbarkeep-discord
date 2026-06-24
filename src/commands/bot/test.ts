import { Channel, PermissionFlagsBits, TextChannel } from "discord.js";
import { Command } from "../../core/Command";
import { SteamAchievementCombinedData } from "../../types/SteamTypes";

export default new Command({
    name: "test",
    description: "NOTHING TO SEE HERE",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    run: async (args): Promise<void> => {
        try {
            args.client.logger.dev("Test began");
            await args.interaction.reply({ content: "Test began" });
            // ======================================================================
            const guildId: string = args.interaction.guild?.id as string;
            const channelID: string = args.interaction.channel?.id as string;
            const channel: Channel = args.client.channels.cache.get(channelID) as TextChannel;

            //const test = await args.client.steam.getGameAchievements(1245620);

            //const test = await args.client.steam.getUserRecentAchievements("");

            /*
            const userList: Array<string> = await args.client.steam.getGuildSteamUsers(guildId);
            const test: SteamAchievementCombinedData[] = await args.client.steam.getAllUsersRecentList(userList);
            console.log(JSON.stringify(test, null, 2));
            */
           //const test = await args.client.steam.getUserRecentGames("");
           //console.log(JSON.stringify(test, null, 2));

            /*
            const recent = await args.client.steam.getUserRecentAchievements("") as SteamAchievementCombinedData[];
            const achievement = recent[0];
            const embed = await args.client.steam.createFeedAchievementEmbed(recent[0]);
            await channel.send({
                embeds: [embed]
            })
            */
            
            

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