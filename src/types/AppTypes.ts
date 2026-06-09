import { z } from "zod";

export type GlobalVar = boolean | number | string;

const GlobalVarTypeSchema = z.union([z.string(), z.number(), z.boolean()]);
export const GlobalVarSchema = z.record(z.string(), GlobalVarTypeSchema);

export type GlobalVarJson = z.infer<typeof GlobalVarSchema>;

const FeatureSchema = z.object({
    enabled: z.boolean(),
    channelId: z.string(),
    output: z.string().optional(),
    feedUri: z.string().optional(),
});

export const GuildSettingsSchema = z.object({
    memo: z.string().optional(),
    id: z.string(),
    features: z.object({
        appletonCam: FeatureSchema,
        birthdays: FeatureSchema,
        bskyFeed: FeatureSchema,
        emoteFeed: FeatureSchema,
        modLog: FeatureSchema,
        oddball: FeatureSchema,
        raFeed: FeatureSchema,
        raWeekly: FeatureSchema,
        steamFeed: FeatureSchema,
        welcome: FeatureSchema,
    }),
    channelsNotToLog: z.array(z.string()),
    commands: z.array(z.string()),
});

export type GuildSettingsJson = z.infer<typeof GuildSettingsSchema>;

export type Features = { [key in FeatureName]: Feature; };

export type Feature = {
    enabled: boolean;
    channelId: string;
    output?: string;
    feedUri?: string;
};

export type FeatureName =
    "appletonCam" |
    "birthdays" |
    "bskyFeed" |
    "emoteFeed" |
    "modLog" |
    "oddball" |
    "raFeed" |
    "raWeekly" |
    "steamFeed" |
    "welcome";

export type EmoteOperation = {
    success: boolean;
    response: string;
} & (
    | { emoteId?: string; emoteName: string }
    | { emoteId: string; emoteName?: string }
);

export type EmoteInfo = {
    name: string;
    cdnUrl: string;
    id: string;
    isAnimated?: boolean;
};

export type TimestampFormats = {
    default: string;
    shortTime: string;
    longTime: string;
    shortDate: string;
    longDate: string;
    shortDateTime: string;
    longDateTime: string;
    relative: string;
};

export type ANSIColor = 
    "default" |
    "black" |
    "red" |
    "green" |
    "yellow" |
    "blue" |
    "magenta" |
    "cyan" |
    "white" |
    "brightBlack" |
    "brightRed" |
    "brightGreen" |
    "brightYellow" |
    "brightBlue" |
    "brightMagenta" |
    "brightCyan" |
    "brightWhite";

export type ANSIColorMap = {
    [key in ANSIColor]: [foreground: number, background: number];
}

export type LogOptions = {
    color: ANSIColor;
    background?: ANSIColor;
    toFile?: boolean;
}