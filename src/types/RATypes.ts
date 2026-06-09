import { UserRecentAchievement } from "@retroachievements/api";
import { z } from "zod";

export const RASettingsSchema = z.object({
    users: z.array(z.string()),
});

export type RASettingsJson = z.infer<typeof RASettingsSchema>;

export type userPoints = {
    username: string,
    points: number
}

export interface retroAchievementData extends UserRecentAchievement {
    username: string,
}

export type RARankingType = 
    "all-time" |
    "daily" |
    "weekly";