import { z } from "zod";

export const SteamUserSchema = z.object({
    note: z.string(),
    steamID64: z.string(),
});

export const SteamSettingsSchema = z.object({
    users: z.array(SteamUserSchema),
});

export type SteamSettingsJson = z.infer<typeof SteamSettingsSchema>;