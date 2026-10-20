import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { DateTime } from 'luxon';
import { Command } from "../../core/Command";
import { Timestamps } from "../../core/Timestamps";
import type { TimestampFormats } from "../../types/AppTypes";

const getTimezones = () => {
    const zones = [
        { name: 'Samoa, Midway Atoll', value: 'Pacific/Midway' },
        { name: 'Hawaii-Aleutian Time, HST', value: 'Pacific/Honolulu' },
        { name: 'Alaska Time, AKST', value: 'America/Anchorage' },
        { name: 'Pacific Time, PST - Los Angeles, Vancouver', value: 'America/Los_Angeles' },
        { name: 'Mountain Time, MST - Denver, Phoenix', value: 'America/Denver' },
        { name: 'Central Time, CST - Chicago, Mexico City', value: 'America/Chicago' },
        { name: 'Eastern Time, EST - New York, Toronto', value: 'America/New_York' },
        { name: 'Atlantic Time, AST - Caracas, Puerto Rico', value: 'America/Halifax' },
        { name: 'Brazil Time, BRT - São Paulo, Buenos Aires', value: 'America/Sao_Paulo' },
        { name: 'Azores, Cape Verde', value: 'Atlantic/Azores' },
        { name: 'Greenwich Mean Time, GMT - London, Reykjavik', value: 'Europe/London' },
        { name: 'Central European Time, CET - Paris, Berlin, Madrid', value: 'Europe/Berlin' },
        { name: 'Eastern European Time, EET - Athens, Cairo, Kyiv', value: 'Europe/Kyiv' },
        { name: 'Moscow Time, MSK - Moscow, Istanbul, Nairobi', value: 'Europe/Moscow' },
        { name: 'Gulf Time, GST - Dubai, Baku, Samara', value: 'Asia/Dubai' },
        { name: 'Pakistan Time, PKT - Karachi, Tashkent', value: 'Asia/Karachi' },
        { name: 'Indian Time, IST - New Delhi, Colombo', value: 'Asia/Kolkata' },
        { name: 'Bangladesh Time, BST - Dhaka, Omsk', value: 'Asia/Dhaka' },
        { name: 'Indochina Time, ICT - Bangkok, Hanoi, Jakarta', value: 'Asia/Bangkok' },
        { name: 'China Time, CST - Beijing, Singapore, Perth', value: 'Asia/Shanghai' },
        { name: 'Japan Time, JST - Tokyo, Seoul, Pyongyang', value: 'Asia/Tokyo' },
        { name: 'Australian Central Time, ACST - Adelaide, Darwin', value: 'Australia/Adelaide' },
        { name: 'Australian Eastern Time, AEST - Sydney, Brisbane', value: 'Australia/Sydney' },
        { name: 'Solomon Islands Time, SBT - Nouméa, Magadan', value: 'Pacific/Guadalcanal' },
        { name: 'New Zealand Time, NZST - Auckland, Fiji', value: 'Pacific/Auckland' },
    ];
    
    return zones.map(zone => {
        // Get current UTC offset in hours, accounting for DST
        const offset = DateTime.now().setZone(zone.value).offset / 60;

        // Format offset to show hours and minutes if necessary
        const formattedOffset = offset % 1 === 0 ? offset.toFixed(0) : offset.toFixed(1);

        return {
            name: `UTC ${formattedOffset.startsWith('-') ? '' : '+'}${formattedOffset} (${zone.name})`,
            value: zone.value
        };
    });
}

export default new Command({
    name: "timestamps",
    description: "Input a date and time to be formatted into Discord timestamps.",
    options: [
        {
            name: "hour",
            description: "The hour (1-12)",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
            max_value: 12
        }, {
            name: "minute",
            description: "The minute (0-59)",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 0,
            max_value: 59
        }, {
            name: "ampm",
            description: "AM or PM",
            type:ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "AM", value: "AM" },
                { name: "PM", value: "PM" }
            ]
        }, {
            name: "timezone",
            description: "Select a timezone (UTC offset)",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: getTimezones()
        }, {
            name: "month",
            description: "The month (1-12), defaults to current",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            min_value: 1,
            max_value: 12
        }, {
            name: "day",
            description: "The day (1-31), defaults to today",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            min_value: 1,
            max_value: 31
        }, {
            name: "year",
            description: "The year, defaults to current",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            min_value: 1970,
            max_value: new Date().getFullYear() + 100
        }
    ],
    run: async (args): Promise<void> => {
        await args.interaction.deferReply();

        // Get arguments
        const now: Date = new Date();
        const year: number = args.options.getInteger("year", false) ?? now.getFullYear(); // Wanna hear a good joke?
        const month: number = args.options.getInteger("month", false) ?? now.getMonth() + 1; // This is zero based
        const day: number = args.options.getInteger("day", false) ?? now.getDate(); // This is not zero based
        const hour12: number = args.options.getInteger("hour", true); // "The Aristocrats"
        const minute: number = args.options.getInteger("minute", true);
        const ampm: string = args.options.getString("ampm", true);
        const timezone: string = args.options.getString("timezone", true);

        // Convert 12 hour to 24
        let hour24 = hour12;
        if (ampm === "PM" && hour12 !== 12) {
            hour24 = hour12 + 12;
        } else if (ampm === "AM" && hour12 === 12) {
            hour24 = 0;
        }

        // Use luxon to create dateTime object
        const dateTime = DateTime.fromObject({ year, month, day, hour: hour24, minute }, { zone: timezone });
        if (!dateTime.isValid) {
            args.interaction.reply({ content: "Invalid date or time. Please try again." });
        }
        // Parse to unix epoch timestamp (seconds) and convert to Discord timestamps
        const unixTimestamp: number = Math.floor(dateTime.toSeconds());
        const formats: TimestampFormats = Timestamps.all(unixTimestamp);

        // Create embed
        const embed: EmbedBuilder = new EmbedBuilder()
            .setColor("#000000")
            .addFields([
                { name: "Input Date:", value: `\`${dateTime.toLocaleString(DateTime.DATETIME_FULL)}\``},
                { name: "\u200B", value: "\u200B" },
                { name: "Short Time:", value: `${formats.shortTime}\n\`${formats.shortTime}\`` },
                { name: "Short Date:", value: `${formats.shortDate}\n\`${formats.shortDate}\`` },
                { name: "Long Date:", value: `${formats.longDate}\n\`${formats.longDate}\`` },
                { name: "Full Date, Short Time:", value: `${formats.fullDateShortTime}\n\`${formats.fullDateShortTime}\`` },
                { name: "Relative:", value: `${formats.relative}\n\`${formats.relative}\`` }
            ]);

        // Send Discord message
        try {
            await args.interaction.editReply({
                embeds: [ embed ],
            });
        } catch (error) {
            console.error(error);
            await args.interaction.editReply({
                content: "Something went wrong with your request.",
            });
        }
    }
});