import * as fs from "fs";
import * as path from "path";
import SteamAPI, { GameInfoBasic, UserAchievements, UserPlaytime } from "steamapi";
import { steam as secrets } from "../../data/apiKeys.json";
import { ExtendedClient } from "../core/ExtendedClient";
import { SteamSettingsJson, SteamSettingsSchema } from "../types/SteamTypes";
import { Guild, TextChannel } from "discord.js";

export class SteamApiManager {
    public readonly defaultMinToLookBack: number = 10;

    private steam: SteamAPI;
    private webApiKey: string = secrets.key;
    private clientRef: ExtendedClient;

    constructor(clientRef: ExtendedClient) {
        this.clientRef = clientRef;
        this.steam = new SteamAPI(this.webApiKey);
    }

    private async getGuildSteamUsers(guildId: string): Promise<Array<string>> {
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

    public async getUserRecentGames(userId: string): Promise<UserPlaytime<GameInfoBasic>[]> {
        return this.steam.getUserRecentGames(userId);
    }

    public async getUserAchievements(userId: string, appId: number): Promise<UserAchievements> {
        return this.steam.getUserAchievements(userId, appId);
    }

    public async getUserRecentAchievements(userId: string) {
        const recentGames: UserPlaytime<GameInfoBasic>[] = await this.getUserRecentGames(userId);
    }

    public async getRecentList(userList: Array<string>, minutesToLookBack: number = this.defaultMinToLookBack) {
        let recentList: Array<{}> = new Array<{}>;
        try {
            //recentList = await this.getRecentList(this.auth, userList, minutesToLookBack);
        } catch (error: unknown) {
            throw error;
        }
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
        let recent: [];
        /*
        try {
            recent = await this.getRecentList(userList, minutesToLookBack);
            if (recent.length === 0) {
                this.clientRef.logger.ra(`${logStr}No new achievements found`);
                return;
            } else {
                const plural: string = recent.length === 1 ? "" : "s";
                this.clientRef.logger.ra(`${logStr}Updating feed with ${recent.length} new achievement${plural}`);
            }
        } catch (error: unknown) {
            this.clientRef.logger.err(`${logStr}${(error as string)}`);
            const channel: TextChannel = this.clientRef.channels.cache.get(channelId) as TextChannel;
            try {
                await channel.send({ content: `${(error as string)}` });
            } catch (error: unknown) {
                this.clientRef.logger.err(`${logStr}Failed to send error notif to RA feed channel`);
            }
            return;
        }
        */
    }

    public async updateAllFeeds(minutesToLookBack: number = this.defaultMinToLookBack): Promise<void> {
        const guilds: Array<string> = await this.clientRef.settings.getGuildIds();

        for (const guildId of guilds) {
            // Check if Steam feed enabled for each guild
            if (!await this.clientRef.settings.isFeatureEnabled(guildId, "steamFeed")) { return; }
            await this.updateFeed(guildId, minutesToLookBack);
        }
    }
}