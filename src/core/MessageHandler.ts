import { Channel, Collection, Guild, Message, TextChannel, User } from "discord.js";
import { EmbedFixManager } from "./EmbedFixManager";
import { ExtendedClient } from "./ExtendedClient";
import { TriggerMap } from "./TriggerMap";
import { Util } from "../util/Util";
import { consoleOutput } from "../../data/config.json";

export class MessageHandler{
    private clientRef: ExtendedClient;
    private triggers: TriggerMap;
    private embedFixer: EmbedFixManager;

    constructor(clientRef: ExtendedClient) {
        this.clientRef = clientRef;
        this.triggers = new TriggerMap(clientRef);
        this.embedFixer = new EmbedFixManager(clientRef);
    }

    public async checkMessage(message: Message): Promise<void> {
        if (consoleOutput.enabled === true && consoleOutput.channelId === message.channelId) return;

        // Replace these with trigger map
        //this.milkCheck(message);
        this.cartonCheck(message);
        this.tipCheck(message);

        this.triggers.check(message);
        
        // MISC CHECKS
        this.embedFixer.check(message);
    }

    public isPossibleMessageId(possibleId: string): boolean {
        const snowflakeRegex: RegExp = /^\d{17,20}$/;
        possibleId = possibleId.replace(/\+/g, ""); // strip space
        return snowflakeRegex.test(possibleId);
    }

    public async getMessage(guildId: string, possibleMessageId: string, startingChannelId?: string): Promise<Message | undefined> {
        const guild: Guild = this.clientRef.guilds.cache.get(guildId) as Guild;
        // If initial channel provided
        if (startingChannelId) {
            try {
                const channel: Channel = this.clientRef.channels.cache.get(startingChannelId) as TextChannel;
                const message: Message = await channel?.messages.fetch(possibleMessageId) as Message;
                return message;
            } catch (error: unknown) { }
        }
        // Else try the rest belonging to this guild
        const textChannels: Collection<string, TextChannel> = guild.channels.cache.filter(channel => channel.isTextBased()) as Collection<string, TextChannel>;
        for (const channel of textChannels.values()) {
            try {
                const message: Message = await channel.messages.fetch(possibleMessageId);
                return message;
            } catch(error: unknown) { continue; }
        }
        this.clientRef.logger.err(`Failed to locate message in guild ${guild.name} (${guildId}) with id: ${possibleMessageId}`);
        return undefined;
    }

    private messageHasBrailleBlank(message: Message): boolean {
        // Check for inserted braille pattern blank characters in message contents
        if (Util.hasBrailleBlank(message.content) ||
            (message.embeds.length > 0 && (
                (message.embeds[0].description && Util.hasBrailleBlank(message.embeds[0].description)) ||
                (message.embeds[0].author?.name && Util.hasBrailleBlank(message.embeds[0].author.name))
            ))) {
                return true;
        } else {
            return false;
        }
    }

    /*
    private async chiliDogCheck(message: Message): Promise<void> {
        if (message.channel.id !== channelIDs.bombsquad.channels.chiliDog) return;
        // const regex = new RegExp("^(<:cfbOrb:950146443170164767>){1}$");
        const regex: RegExp = new RegExp("^(suckin on a chili dog){1}$");
        if (regex.test(message.content) === false) {
            message.delete();
        }
    }
    */

    private async milkCheck(message: Message): Promise<void> {
        const melkEmote: string = "melk:616025879830855681";
        const milkStrings: string[] = ["milk", "melk", "malk", "mork", "milch"];
        const milkRegex: RegExp = new RegExp(milkStrings.join("|"), "i");

        if (milkRegex.test(message.content)) {
            message.react(melkEmote);
            const milks: number = await this.clientRef.settings.incrementGlobalVar("milks") as number;
            this.clientRef.setMilkStatus(milks);
        }
    }

    /* Convert this to some kind of chat command or macro manager */
    private async tipCheck(message: Message): Promise<void> {
        const regex: RegExp = /!tip/;
        const response: string = "<:cfbANY:1201985868319948831> ???\nhttps://streamelements.com/carefreebomb/tip";

        if (regex.test(message.content)) {
            await message.reply(response);
        }
    }

    private async cartonCheck(message: Message): Promise<void> {
        const regex = /^!milk(?:\s+(?:<@!?(\d+)>|@?([\w.-]+)))?$/;
        let response: string = `\`\`\`
 ___________________
< Milk me, username >
 -------------------
 \\     ____________
  \\    |__________|
      /           /\\
     /           /  \\
    /___________/___/|
    |          |     |
    |  ==\\ /== |     |
    |   O   O  | \\ \\ |
    |     <    |  \\ \\|
   /|          |   \\ \\
  / |  \\_____/ |   / /
 / /|          |  / /|
/||\\|          | /||\\/
    -------------|
        | |    | |
       <__/    \\__>\n\`\`\``;

        const match: RegExpMatchArray | null = message.content.match(regex);
        if (!match) { return; }

        const userId: string = match[1]; // from <@ID>
        const inputName: string = match[2]; // from plain text
        let nameToUse: string = message.author.displayName;

        if (userId) {
            try {
                const user: User = await this.clientRef.users.fetch(userId);
                nameToUse = user.displayName;
            } catch {
                nameToUse = `<@${userId}>`;
            }
        } else if (inputName) {
            nameToUse = inputName;
        }
        
        await message.reply(response.replace("username", nameToUse));
    }
}