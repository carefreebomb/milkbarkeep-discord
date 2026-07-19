import * as fs from "fs";
import * as path from "path";
import { ExtendedClient } from "./ExtendedClient";
import { BirthdaysSchema, type BirthdaysJson } from "../types/FeatureTypes";
import { Channel, Guild, TextChannel } from "discord.js";

export class Birthdays {

    private static getTodayInMMDD(): string {
        const today: Date = new Date();
        const month: string = (today.getMonth() + 1).toString().padStart(2, "0"); // zero-indexed
        const day: string = today.getDate().toString().padStart(2, "0");
        const todayInMMDD: string = `${month}-${day}`;
        return todayInMMDD;
    }

    public static getUpcomingDateFromMMDD(inputMMDD: string): Date {
        const [month, day] = inputMMDD.split("-").map(Number);
        const today = new Date();
        const year = today.getFullYear();
        let dateObj = new Date(year, month - 1, day);
        if (
            dateObj.getMonth() < today.getMonth() ||
            (dateObj.getMonth() === today.getMonth() && dateObj.getDate() < today.getDate())
        ) {
            dateObj = new Date(year + 1, month - 1, day);
        }
        return dateObj;
    }

    private static async getBirthdaysJsonArray(clientRef: ExtendedClient, guildId: string): Promise<Array<BirthdaysJson>> {
        const filePath: string = path.resolve(__dirname, `./../../data/guilds/${guildId}`, "birthdays.json");
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`birthdays.json file not located for guild: ${guildId}`);
            }
            const fileData: string = await fs.promises.readFile(filePath, 'utf-8');
            const rawJson: Array<BirthdaysJson> = JSON.parse(fileData);
            const validatedJson: Array<BirthdaysJson> = BirthdaysSchema.parse(rawJson);
            return validatedJson;
        } catch (error) {
            clientRef.logger.err(error as string);
            return [];
        }
    }

    public static async getUpcomingByDayCount(clientRef: ExtendedClient, guildId: string, dayCount: number = 5) {
        const isEnabled: boolean = await clientRef.settings.isFeatureEnabled(guildId, "birthdays");
        if (!isEnabled) {
            throw new Error(`Command used for feature not enabled in guild: ${guildId}`);
        }
        const todayInMMDD: string = this.getTodayInMMDD();
        const birthdays: Array<BirthdaysJson> = await this.getBirthdaysJsonArray(clientRef, guildId);
        const thisYear: Array<BirthdaysJson> = birthdays.filter(obj => obj.date >= todayInMMDD);
        const nextYear: Array<BirthdaysJson> = birthdays.filter(obj => obj.date < todayInMMDD);
        const ordered: Array<BirthdaysJson> = [...thisYear, ...nextYear];
        const distinctDates = Array.from(new Set(ordered.map(obj => obj.date))).slice(0, dayCount);
        return ordered.filter(obj => distinctDates.includes(obj.date));
    }

    public static async getUserBirthday(clientRef: ExtendedClient, guildId: string, userId: string): Promise<Array<BirthdaysJson>> {
        const isEnabled: boolean = await clientRef.settings.isFeatureEnabled(guildId, "birthdays");
        if (!isEnabled) {
            throw new Error(`Command used for feature not enabled in guild: ${guildId}`);
        }
        const birthdays: Array<BirthdaysJson> = await this.getBirthdaysJsonArray(clientRef, guildId);
        return birthdays.filter(obj => obj.userId === userId);
    }
    
    public static async check(clientRef: ExtendedClient): Promise<void> {
        const guilds: Array<string> = await clientRef.settings.getGuildIds();

        for (const guildId of guilds) {
            const guild: Guild = clientRef.guilds.cache.get(guildId) as Guild;

            // Check if birthday announcements enabled for each guild
            const isEnabled: boolean = await clientRef.settings.isFeatureEnabled(guildId, "birthdays");
            if (!isEnabled) return;

            // Check if proper channelId stored
            const channelId: string = await clientRef.settings.getChannelId(guildId, "birthdays");
            if (!channelId) {
                clientRef.logger.err(`${guild.name} - Birthday messages enabled, but no channel set.`);
                return;
            }
            
            // Get birthday data for guild then check for matches today
            clientRef.logger.bot(`${guild.name} - Checking for birthdays`);
            const birthdays: Array<BirthdaysJson> = await this.getBirthdaysJsonArray(clientRef, guildId);
            const todayInMMDD: string = this.getTodayInMMDD();
            const resultIDs: string[] = birthdays.filter(obj => obj.date === todayInMMDD).map(obj => obj.userId);
            const resultTags: string[] = birthdays.filter(obj => obj.date === todayInMMDD).map(obj => `<@${obj.userId}>`);

            // Then post birthday message to channel
            if (resultIDs.length > 0) {
                const lf: Intl.ListFormat = new Intl.ListFormat("en");
                let botStr: string = "Today it's " + lf.format(resultTags) + "'s birthday! POGGGG 🥛🎂🖤";
                const botId: string = clientRef?.application?.bot?.id ?? "";
                if (resultIDs.includes(botId)) { botStr += "\nHey, that's me! 🤖"; }
                clientRef.logger.bot(`${guild.name} - ${botStr}`);
                const channel: Channel = clientRef.channels.cache.get(channelId) as TextChannel;
                await channel.send({
                    "content": botStr,
                    "allowedMentions": { "users": [ ...resultIDs ] },
                });
            }
        }
    }
}