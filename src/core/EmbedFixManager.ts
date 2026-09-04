import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, MessageActionRowComponentBuilder, TextChannel, User } from "discord.js";
import { ExtendedClient } from "./ExtendedClient";
import { Util } from "../util/Util";
import { client } from "..";
import { ytDlpPath } from "../../data/config.json";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { unlink } from "node:fs/promises";
import type { EmbedFixUrls } from "../types/FeatureTypes";
import path from "node:path";
import os from "node:os";

export class EmbedFixManager {
    private clientRef: ExtendedClient;
    private readonly domainMap: Map<string, string> = new Map<string, string>([
        ["instagram.com", "kkinstagram.com"],
        ["tiktok.com", "vxtiktok.com"],
        ["twitter.com", "fixupx.com"],
        ["x.com", "fixupx.com"]
    ]);

    constructor(clientRef: ExtendedClient) {
        this.clientRef = clientRef;
    }

    public async check(message: Message): Promise<void> {
        // Ignore messages from this bot user
        const author: User = message.author as User;
        if (author.displayName === client.user?.displayName) return;
        // Check for any possible fixable domains in message
        const domainToFix = await this.detectFixableDomain(message);
        // If not found, exit. Else prompt user for next step
        if (domainToFix === null) return;
        this.askIfShouldFix(message);
    }

    private async detectFixableDomain(message: Message): Promise<EmbedFixUrls | null> {
        // Match all domains in map with a prefix of either https:// or https://www. (and not bracket hidden)
        const regex: RegExp = new RegExp(
            `(?<!<)(https://(?:www\\.)?(${[...this.domainMap.keys()].join('|')})(/[^\\s]*)?)(?!>)(?!<[^>]*$)`,
            'i' // 'i' flag for case-insensitive matching
        );
        const match = message.content.match(regex);
        if (match) {
            const oldUrl: string = match[0];
            const oldDomain: string = match[2];
            const newDomain: string = this.domainMap.get(oldDomain) as string;
            const newUrl: string = oldUrl.replace(oldDomain, newDomain);
            return { oldUrl, oldDomain, newUrl, newDomain };
        }
        return null;
    }

    private async askIfShouldFix(message: Message): Promise<void> {
        // Create choice buttons for initial reply
        const components: Array<ButtonBuilder> = [];
        const yesButton: ButtonBuilder = new ButtonBuilder()
            .setCustomId("yes")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success);
        components.push(yesButton);
        const noButton: ButtonBuilder = new ButtonBuilder()
            .setCustomId("no")
            .setLabel("No")
            .setStyle(ButtonStyle.Danger);
        components.push(noButton);
        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(components);

        // Send it
        const askReply = await message.reply({
            content: "Would you like me to fix the embed?",
            components: [ row ]
        });

        // Create event handler for buttons
        const collector = askReply.createMessageComponentCollector();
        collector.on("collect", async (newInteraction) => {
            await newInteraction.deferUpdate();

            const guildName: string = message?.guild?.name as string;
            const channel: TextChannel = message?.channel as TextChannel;
            const channelName: string = channel.name;
            
            // Get user choice from buttons
            let choice: string = newInteraction.customId;

            // First check if original message was deleted before button press
            try {
                if (!(newInteraction.message.reference && newInteraction.message.reference?.messageId)) {
                    choice = "no";
                }
            } catch (error) {
                this.clientRef.logger.err(`${guildName} ~ #${channelName} - ${error}`);
            }

            // If user chose to fix embed, and original message still exists, create new reply
            if (choice === "no") {
                await newInteraction.message.delete();
            } else {
                // message.suppressEmbeds();
                const urls: EmbedFixUrls = await this.detectFixableDomain(message) as EmbedFixUrls;
                if (urls.oldDomain === "instagram.com") {
                    try {
                        await newInteraction.message.edit({
                            content: "Checking for reel...",
                            components: []
                        });
                        this.clientRef.logger.bot(`${guildName} ~ #${channelName} - Checking for Instagram reel: ${urls.oldUrl}`);
                        const filePath: string | null = await this.downloadInstagramReel(urls.oldUrl);
                        if (filePath) {
                            await newInteraction.message.edit({
                                content: `<${urls.oldUrl}>`,
                                files: [filePath]
                            });
                            await unlink(filePath);
                            return;
                        }
                    } catch (error: unknown) {
                        this.clientRef.logger.err(`${guildName} ~ #${channelName} - Error saving Instagram reel (${urls.oldUrl}): ${error}`);
                        await newInteraction.message.edit({
                            content: `Sorry, ${error}`
                        });
                    }
                }
                const msgStr: string = Util.addBrailleBlank(`via [${urls.newDomain}](${urls.newUrl}):`);
                await newInteraction.message.edit(msgStr);
            }
        });
    }

    private async downloadInstagramReel(url: string): Promise<string | null> {
        const execFileAsync = promisify(execFile);

        const output = path.join(
            os.tmpdir(),
            `reel-${Date.now()}.%(ext)s`
        );

        try {
            const { stdout } = await execFileAsync(ytDlpPath, [
                "--update",
                "--no-playlist",
                "--dump-single-json",
                url
            ]);

            const info = JSON.parse(stdout);

            // No video found
            if (!info.url && !info.formats?.some((f: any) => f.vcodec !== "none")) {
                return null;
            }

            // Download if found
            await execFileAsync(ytDlpPath, [
                "--update",
                "--no-playlist",
                "-f", "best[ext=mp4]/best",
                "-o", output,
                url
            ]);

            return output.replace("%(ext)s", "mp4");
        } catch (error: unknown) {
            throw error;
        }
    }
}