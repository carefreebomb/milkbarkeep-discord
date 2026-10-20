import OpenWeatherMap from "openweathermap-ts";
import { EmbedBuilder } from "discord.js";
import { Convert } from "../util/Convert";
import { Timestamps } from "../core/Timestamps";
import { openWeatherMap as apiKey } from "../../data/apiKeys.json";
import type { CurrentResponse } from "openweathermap-ts/dist/types";

export class OpenWeatherMapApi extends OpenWeatherMap {
    private apiKey: string;

    constructor() {
        super({
            apiKey: apiKey,
        });
        this.apiKey = apiKey;
        this.setUnits("imperial");
    }

    private iconUrl(iconId: string): string {
        return `https://openweathermap.org/img/wn/${iconId}@2x.png`;
    }

    public async createEmbed(data: CurrentResponse, imageUrl: string = ""): Promise<EmbedBuilder> {
        // Weather data variables
        const weatherDesc: string = data.weather[0].description.replace(/\b\w/g, (char: string) => char.toUpperCase());
        const iconId: string = data.weather[0].icon;
        const temp: number = data.main.temp;
        const feelsLike: number = data.main.feels_like;
        const min: number = data.main.temp_min;
        const max: number = data.main.temp_max;
        const humidity: number = data.main.humidity;
        const windSpeed: number = data.wind.speed;
        const windDir: string = Convert.degreesToCompass(data.wind.deg);

        // Time variables
        const now: Date = new Date();
        const longDateTime: string = Timestamps.fullDateShortTime(now);
        const relativeTime: string = Timestamps.relative(now);
        const outputStr: string = `${longDateTime}\n(${relativeTime})`;
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        const formattedTime: string = new Intl.DateTimeFormat('en-US', options).format(now);
        
        // Formatted embed strings
        const tempStr: string = `${temp.toFixed(0)} °F (${Convert.fToC(temp).toFixed(0)} °C)`;
        const feelsLikeStr: string = `${feelsLike.toFixed(0)} °F (${Convert.fToC(feelsLike).toFixed(0)} °C)`;
        const minMaxStr: string = `${min.toFixed(0)}/${max.toFixed(0)} °F (${Convert.fToC(min).toFixed(0)}/${Convert.fToC(max).toFixed(0)} °C)`;
        const windStr: string = `${windSpeed.toFixed(0)} mph (${Convert.mphToMps(windSpeed).toFixed(0)} m/s) ${windDir}`;
        const titleStr: string = `${formattedTime}\n${weatherDesc}\n${temp.toFixed(0)} °F (${Convert.fToC(temp).toFixed(0)} °C)`;
        const descStr: string =
            `**Your Time:** ${outputStr}\n\n` +
            `**Feels Like:** ${feelsLikeStr}\n` +
            `**Range:** ${minMaxStr}\n` +
            `**Humidity:** ${humidity} %\n` +
            `**Wind:** ${windStr}`
        ;

        return new EmbedBuilder()
            .setColor("#1E1F22")
            .setTitle(titleStr)
            .setDescription(descStr)
            .setThumbnail(this.iconUrl(iconId))
            .setImage(imageUrl);
    }
}