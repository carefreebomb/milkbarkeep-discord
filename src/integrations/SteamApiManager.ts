import * as fs from "fs";
import * as path from "path";
import SteamAPI, { Game, GameInfo, GameInfoBasic, GameInfoExtended, UserAchievements, UserPlaytime, UserSummary } from "steamapi";
import GameSchema from "steamapi/dist/src/structures/GameSchema";
import { steam as secrets } from "../../data/apiKeys.json";
import { ExtendedClient } from "../core/ExtendedClient";
import { SteamAchievementCombinedData, SteamAchievementData, SteamAchievementResponse, SteamSettingsJson, SteamSettingsSchema } from "../types/SteamTypes";
import { ColorResolvable, EmbedBuilder, Guild, TextChannel } from "discord.js";
import { Timestamps } from "../core/Timestamps";

export class SteamApiManager {
    public readonly defaultMinToLookBack: number = 10;

    private steam: SteamAPI;
    private webApiKey: string = secrets.key;
    private clientRef: ExtendedClient;

    constructor(clientRef: ExtendedClient) {
        this.clientRef = clientRef;
        this.steam = new SteamAPI(this.webApiKey, { language: "english" });
    }

    // #region SETTINGS

    public async getGuildSteamUsers(guildId: string): Promise<Array<string>> {
        const users = (await this.getGuildSteamSettings(guildId)).users;
        const steamIds = users.map(user => user.steamID64);
        return steamIds;
    }

    private async getGuildSteamSettings(guildId: string): Promise<SteamSettingsJson> {
        const guildDir: string = path.resolve(__dirname, './../../data/guilds', guildId);
        const settingsFile: string = path.resolve(guildDir, "steamUsers.json");

        if (fs.existsSync(settingsFile)) {
            const rawJson = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            try {
                const validatedJson: SteamSettingsJson = SteamSettingsSchema.parse(rawJson);
                return validatedJson;
            } catch (error: unknown) {
                this.clientRef.logger.err(`Invalid Steam JSON settings for guild ${path.basename(guildDir)}: ${error}`);
                throw error;
            }
        } else {
            const errorStr: string = `No Steam settings file located for guild ${path.basename(guildDir)}`;
            this.clientRef.logger.err(errorStr);
            throw new Error(errorStr);
        }
    }

    // #region API CALLS

    private async getGameSchema(appId: number | string): Promise<GameSchema | null> {
        try {
            const schema: GameSchema = await this.steam.getGameSchema(Number(appId), "english");
            return schema;
        } catch (error: unknown) {
            this.clientRef.logger.stm(`Error retrieving schema for appId ${appId}: ${error}`);
            return null;
        }
    }

    public async getGameAchievements(appId: number | string): Promise<Array<SteamAchievementData> | null> {
        try {
            const response: SteamAchievementResponse = await this.steam.get(
                "/IPlayerService/GetGameAchievements/v1/",
                {
                    appid: appId,
                    language: "english"
                }
            );
            const achievements: SteamAchievementData[] = response.response.achievements;
            return achievements;
        } catch (error: unknown) {
            this.clientRef.logger.stm(`Error retrieving achievement data for appId ${appId}: ${error}`);
            return null;
        }
    }

    public async getUserOwnedGames(userId: string): Promise<UserPlaytime<Game | GameInfo | GameInfoExtended>[] | null> {
        try {
            const userOwnedGames: UserPlaytime<Game | GameInfo | GameInfoExtended>[] = 
                await this.steam.getUserOwnedGames(userId, { includeAppInfo: true, includeExtendedAppInfo: false });
            return userOwnedGames;
        } catch (error: unknown) {
            this.clientRef.logger.stm(`Error retrieving owned games for userId ${userId}: ${error}`);
            return null;
        }
    }

    public async getUserRecentGames(userId: string): Promise<UserPlaytime<GameInfoBasic>[] | null> {
        try {
            const userRecentGames: UserPlaytime<GameInfoBasic>[] = await this.steam.getUserRecentGames(userId);
            return userRecentGames;
        } catch (error: unknown) {
            this.clientRef.logger.stm(`Error retrieving recent games for userId ${userId}: ${error}`);
            return null;
        }
    }

    public async getUserAchievements(userId: string, appId: number, minutesToLookBack: number = this.defaultMinToLookBack, 
        filterOutLocked: boolean = true): Promise<UserAchievements | null> {
        try {
            const gameAchievements: UserAchievements = await this.steam.getUserAchievements(userId, appId);
            if (filterOutLocked === true) {
                gameAchievements.achievements = gameAchievements.achievements.filter(a => a.unlocked);
            }
            
            if (minutesToLookBack !== undefined) {
                const cutoff = Math.floor(Date.now() / 1000) - (minutesToLookBack * 60);
                gameAchievements.achievements = gameAchievements.achievements.filter(a => 
                    (a.unlockedTimestamp !== undefined) && (a.unlockedTimestamp >= cutoff));
            }
            return gameAchievements;
        } catch (error: unknown) {
            throw error;
        }
    }

    // #region LOGIC

    public async getUserRecentAchievements(userId: string, minutesToLookBack: number = this.defaultMinToLookBack): Promise<Array<SteamAchievementCombinedData> | null> {
        const gamesToCheck: Map<number, { id: number, name: string, data: Array<SteamAchievementData> }> = 
            new Map<number, { id: number, name: string , data: Array<SteamAchievementData> }>();

        // Get user summary, currently playing, and recently played games
        const userSummary: UserSummary = await this.steam.getUserSummary(userId);
        const userCurrentGameId: number | undefined = userSummary.gameID;
        const userCurrentGameName: string | undefined = userSummary.gameName;
        const userRecentGames: UserPlaytime<GameInfoBasic>[] | null = await this.getUserRecentGames(userId);

        // If user not currently playing or hasn't recently played, no recent achievements, so return
        if (!userRecentGames && !userCurrentGameId) return null;
        
        // If any currently playing game, get achievement data
        if (userCurrentGameId !== undefined) {
            const gameAchievementData: SteamAchievementData[] | null = await this.getGameAchievements(userCurrentGameId);
            if (gameAchievementData) {
                // Explicitly casting since for whatever reason, the summary endpoint returns a string that gets by here,
                // despite the library collection class using a number type, and my map key set as a number type, and the
                // recently played endpoint using numbers for id. Just javascript things I guess, idk I'm tired
                gamesToCheck.set(Number(userCurrentGameId), { id: userCurrentGameId, name: userCurrentGameName ?? " ", data: gameAchievementData});
            }
        }

        // If any recently played games, get achievement data, filter out setless games
        if (userRecentGames) {
            for (const recent of userRecentGames) {
                // If there was a currently playing game, don't add it twice if it was also already in the recently played list
                if (gamesToCheck.has(recent.game.id)) { continue; }
                
                const gameAchievementData: SteamAchievementData[] | null = await this.getGameAchievements(recent.game.id);
                if (gameAchievementData && gameAchievementData.length > 0) {
                    gamesToCheck.set(recent.game.id, { id: recent.game.id, name: recent.game.name, data: gameAchievementData });
                }
            }
        }

        // Get user's unlock data for each remaining game
        const userRecentAchievements: SteamAchievementCombinedData[] = [];
        try {
            for (const currentGame of gamesToCheck.values()) {
                const userGameResults: UserAchievements | null = await this.getUserAchievements(userId, currentGame.id);

                // If there is achievement data, merge everything as one formatted object
                if (userGameResults) {
                    for (const userAchievement of userGameResults.achievements) {
                        const dataAchievement = currentGame.data?.find(
                            a => a.internal_name === userAchievement.name
                        );

                        const data: SteamAchievementCombinedData = {
                            user: {
                                id: userId,
                                displayName: userSummary.nickname,
                                url: userSummary.url,
                                avatar: userSummary.avatar.small,
                            },
                            achievement: {
                                timestamp: userAchievement.unlockedTimestamp ?? 0,
                                name: userAchievement.name,
                                displayName: dataAchievement?.localized_name ?? " ",
                                description: dataAchievement?.localized_desc ?? " ",
                                hidden: Boolean(dataAchievement?.hidden) ?? false,
                                icon: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${currentGame.id}/${dataAchievement?.icon}`,
                                playerPercent: dataAchievement?.player_percent_unlocked ?? " ",
                            },
                            app: {
                                id: currentGame.id,
                                name: currentGame.name,
                            }
                        };
                        userRecentAchievements.push(data);
                    }
                }
            }
        } catch (error: unknown) {
            // Likely a Forbidden error, aka permissions issue
            this.clientRef.logger.stm(`Failed to retrieve achievement data for userId: ${userId} -  ${error}`);
            return null;
        }
        return userRecentAchievements;
    }

    public async getAllUsersRecentList(userList: Array<string>, minutesToLookBack: number = this.defaultMinToLookBack): Promise<Array<SteamAchievementCombinedData>> {
        const recentList: Array<SteamAchievementCombinedData> = [];
        try {
            for (const user of userList) {
                const userRecentAchievements: SteamAchievementCombinedData[] | null = await this.getUserRecentAchievements(user, minutesToLookBack);
                if (userRecentAchievements) recentList.push(...userRecentAchievements);
            }
        } catch (error: unknown) {
            throw error;
        }
        recentList.sort((a, b) => a.achievement.timestamp - b.achievement.timestamp);
        return recentList;
    }

    public async updateFeed(guildId: string, minutesToLookBack: number = this.defaultMinToLookBack) {
        const userList: Array<string> = await this.getGuildSteamUsers(guildId);
        const channelId: string = await this.clientRef.settings.getChannelId(guildId, "steamFeed");
        const channel: TextChannel = await this.clientRef.channels.fetch(channelId) as TextChannel;
        const channelName: string = channel.name;
        const guild: Guild = await this.clientRef.guilds.fetch(guildId);
        const guildName: string = guild.name;
        const logStr: string = `${guildName} ~ ${channelName} - `;

        // Get array of recent achievements
        let recent: Array<SteamAchievementCombinedData>;
        try {
            recent = await this.getAllUsersRecentList(userList, minutesToLookBack);
            if (recent.length === 0) {
                this.clientRef.logger.stm(`${logStr}No new achievements found`);
                return;
            } else {
                const plural: string = recent.length === 1 ? "" : "s";
                this.clientRef.logger.stm(`${logStr}Updating feed with ${recent.length} new achievement${plural}`);
            }
        } catch (error: unknown) {
            this.clientRef.logger.err(`${logStr}${(error as string)}`);
            const channel: TextChannel = this.clientRef.channels.cache.get(channelId) as TextChannel;
            try {
                await channel.send({ content: `${(error as string)}` });
            } catch (error: unknown) {
                this.clientRef.logger.err(`${logStr}Failed to send error notif to Steam feed channel`);
            }
            return;
        }

        // Create and send embeds
        try {
            const channel: TextChannel = this.clientRef.channels.cache.get(channelId) as TextChannel;
            for (const achievement of recent) {
                const embed: EmbedBuilder = await this.createFeedAchievementEmbed(achievement);
                await channel.send({
                    embeds: [ embed ],
                });
            }
        } catch (error: unknown) {
            this.clientRef.logger.err(error as string);
        }
    }

    public async updateAllFeeds(minutesToLookBack: number = this.defaultMinToLookBack): Promise<void> {
        const guilds: Array<string> = await this.clientRef.settings.getGuildIds();

        for (const guildId of guilds) {
            // Check if Steam feed enabled for each guild
            if (!await this.clientRef.settings.isFeatureEnabled(guildId, "steamFeed")) { return; }
            await this.updateFeed(guildId, minutesToLookBack);
        }
    }

    // #region EMBEDS

    public async createFeedAchievementEmbed(data: SteamAchievementCombinedData): Promise<EmbedBuilder> {
        const achievementPageUrl: string = `https://steamcommunity.com/stats/${data.app.id}/achievements`;
        const color: ColorResolvable = "Navy";
        const description: string = (data.achievement.hidden) ? `||${data.achievement.description}||` : data.achievement.description;
        const storePageUrlString: string = `[${data.app.name}](https://store.steampowered.com/app/${data.app.id}/${this.steamTitleUrlSlug(data.app.name)}/)`;
        const discordTimestamp: string = Timestamps.default(data.achievement.timestamp);

        const embed: EmbedBuilder = new EmbedBuilder()
            .setColor(color)
            .setTitle(data.achievement.displayName)
            .setURL(achievementPageUrl)
            .setAuthor({
                name: data.user.displayName,
                iconURL: data.user.avatar,
                url: data.user.url,
            })
            .setDescription(description)
            .setThumbnail(data.achievement.icon)
            .addFields(
                { name: "Game:", value: storePageUrlString, inline: false },
                { name: "Global Unlocks:", value: `${data.achievement.playerPercent}%`, inline: true },
                { name: "DateTime (Yours):", value: discordTimestamp, inline: true },
            );
        return embed;
    }

    private steamTitleUrlSlug(title: string): string {
        return title.normalize("NFKD").replace(/[^\w\s]/g, "").trim().replace(/\s+/g, "_").replace(/_+/g, "_");
    }
}