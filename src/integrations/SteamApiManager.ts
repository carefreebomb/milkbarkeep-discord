import * as fs from "fs";
import * as path from "path";
import SteamAPI, { GameInfoBasic, UserPlaytime } from "steamapi";
import { steam as secrets } from "../../data/apiKeys.json";
import { ExtendedClient } from "../core/ExtendedClient";
import { SteamSettingsJson, SteamSettingsSchema } from "../types/SteamTypes";

export class SteamApiManager {
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
}