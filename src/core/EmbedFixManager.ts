import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, MessageActionRowComponentBuilder, User } from "discord.js";
import { Util } from "../util/Util";
import { client } from "..";
import type { EmbedFixUrls } from "../types/FeatureTypes";

export class EmbedFixManager {
    private static readonly domainMap: Map<string, string> = new Map<string, string>([
        ["instagram.com", "kkinstagram.com"],
        ["tiktok.com", "vxtiktok.com"],
        ["twitter.com", "fixupx.com"],
        ["x.com", "fixupx.com"]
    ]);

    public static async check(message: Message): Promise<void> {
        // Ignore messages from this bot user
        const author: User = message.author as User;
        if (author.displayName === client.user?.displayName) return;
        // Check for any possible fixable domains in message
        const domainToFix = await this.detectFixableDomain(message);
        // If not found, exit. Else prompt user for next step
        if (domainToFix === null) return;
        this.askIfShouldFix(message);
    }

    private static async detectFixableDomain(message: Message): Promise<EmbedFixUrls | null> {
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

    private static async askIfShouldFix(message: Message): Promise<void> {
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
            
            // Get user choice from buttons
            let choice: string = newInteraction.customId;

            // First check if original message was deleted before button press
            try {
                if (!(newInteraction.message.reference && newInteraction.message.reference?.messageId)) {
                    choice = "no";
                }
            } catch (error) {
                console.log(error);
            }

            // Delete question reply
            await newInteraction.message.delete();

            // If user chose to fix embed, and original message still exists, create new reply
            if (choice === "yes") {
                message.suppressEmbeds();
                const urls: EmbedFixUrls = await this.detectFixableDomain(message) as EmbedFixUrls;
                const msgStr: string = Util.addBrailleBlank(`via [${urls.newDomain}](${urls.newUrl}):`);
                await message.reply(msgStr);
            }
        });
    }
}