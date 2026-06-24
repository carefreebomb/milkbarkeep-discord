import { z } from "zod";

export const SteamUserSchema = z.object({
    note: z.string(),
    steamID64: z.string(),
});

export const SteamSettingsSchema = z.object({
    users: z.array(SteamUserSchema),
});

export type SteamSettingsJson = z.infer<typeof SteamSettingsSchema>;

export type SteamAchievementData = {
    internal_name: string,
    localized_name: string,
    localized_desc: string,
    icon: string,
    icon_gray: string,
    hidden: boolean,
    player_percent_unlocked: string,
    internal_key: number,
    groupid: number,
    archived: boolean,
    progress_type: number,
};

export type SteamAchievementResponse = {
    response: {
        achievements: Array<SteamAchievementData>,
    }
};

export type SteamAchievementCombinedData = {
    user: {
        id: string,
        displayName: string,
        url: string,
        avatar: string,
    },
    achievement: {
        timestamp: number,
        name: string,
        displayName: string,
        description: string,
        hidden: boolean,
        icon: string,
        playerPercent: string,
    },
    app: {
        id: number,
        name: string,
    }
};