import { TimestampStylesString, time } from "discord.js";
import type { TimestampFormats } from "../types/AppTypes";

export class Timestamps {

    /**
     * Discord timestamps can be useful for specifying a date/time across multiple users time zones. 
     * They work with the Unix Timestamp format and can be posted by regular users as well as bots and applications.
     * https://gist.github.com/LeviSnoot/d9147767abeef2f770e9ddcd91eb85aa
     * https://docs.discord.com/developers/reference#message-formatting-timestamp-styles
     * https://old.discordjs.dev/#/docs/discord.js/14.14.1/typedef/TimestampStylesString
     */
    private static format(timeIn: Date | number, styleString?: TimestampStylesString): string {
        const seconds: number = (typeof timeIn === "number") ? timeIn : Math.floor(timeIn.getTime() / 1000);
        return styleString ? time(seconds, styleString) : time(seconds);
    }

    public static all(timestamp: Date | number): TimestampFormats {
        return {
            shortTime: Timestamps.shortTime(timestamp),
            mediumTime: Timestamps.mediumTime(timestamp),
            shortDate: Timestamps.shortDate(timestamp),
            longDate: Timestamps.longDate(timestamp),
            default: Timestamps.default(timestamp),
            longDateShortTime: Timestamps.longDateShortTime(timestamp),
            fullDateShortTime: Timestamps.fullDateShortTime(timestamp),
            shortDateShortTime: Timestamps.shortDateShortTime(timestamp),
            shortDateMediumTime: Timestamps.shortDateMediumTime(timestamp),
            relative: Timestamps.relative(timestamp)
        }
    }

    /**
     * t
     * 16:20
     * Short Time
     */
    public static shortTime(timestamp: Date | number): string {
        return Timestamps.format(timestamp, "t");
    }

    /**
     * T
     * 16:20:30
     * Medium Time
     */
    public static mediumTime(timestamp: Date | number): string {
        return Timestamps.format(timestamp, "T");
    }

    /**
     * d
     * 20/04/2021
     * Short Date
     */
    public static shortDate(timestamp: Date | number): string {
        return Timestamps.format(timestamp, "d");
    }

    /**
     * D
     * April 20, 2021
     * Long Date
     */
    public static longDate(timestamp: Date | number): string {
        return Timestamps.format(timestamp, "D");
    }

    /**
     * f*
     * April 20, 2021 at 16:20
     * Long Date, Short Time
     */
    public static default(timestamp: Date | number): string {
        return Timestamps.format(timestamp);
    }

    /**
     * f*
     * April 20, 2021 at 16:20
     * Long Date, Short Time
     */
    public static longDateShortTime(timestamp: Date | number): string {
        return Timestamps.format(timestamp, "f");
    }

    /**
     * F
     * Tuesday, 20 April 2021 16:20
     * Full Date, Short Time
     */
    public static fullDateShortTime(timestamp: Date | number): string {
        return Timestamps.format(timestamp, "F");
    }

    /**
     * s
     * 20/04/2021, 16:20
     * Short Date, Short Time
     */
    public static shortDateShortTime(timestamp: Date | number): string {
        return Timestamps.format(timestamp, "s");
    }

    /**
     * S
     * 20/04/2021, 16:20:30
     * Short Date, Medium Time
     */
    public static shortDateMediumTime(timestamp: Date | number): string {
        return Timestamps.format(timestamp, "S");
    }

    /**
     * R
     * 2 months ago
     * Relative Time
     */
    public static relative(timestamp: Date | number): string {
        return Timestamps.format(timestamp, "R");
    }
}