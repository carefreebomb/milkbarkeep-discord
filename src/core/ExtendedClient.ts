import { 
    ActivityType,
    ApplicationCommandDataResolvable, 
    Channel, 
    Client, 
    ClientEvents, 
    Collection, 
    GatewayIntentBits, 
    MessageCreateOptions,
    MessagePayload,
    TextChannel} from "discord.js";
import { glob } from "glob";
import { Event } from "./Event";
import { GuildSettingsManager } from "./GuildSettingsManager";
import { Logger } from "./Logger";
import { MessageHandler } from "./MessageHandler";
import { RetroAchievementsManager } from "../integrations/RetroAchievementsManager";
import { Scheduler } from "./Scheduler";
import { BlueskyManager } from "../integrations/BlueskyManager";
import { EmoteManager } from "./EmoteManager";
import { StickerManager } from "./StickerManager";
import { discordAppToken } from "../../data/config.json";
import type { CommandType } from "../types/CommandTypes";
import type { GlobalVar } from "../types/AppTypes";

export class ExtendedClient extends Client {
    public shouldRegisterCommands: boolean = false;
    
    public logger: Logger;
    public scheduler: Scheduler;
    public messageHandler: MessageHandler;
    public settings: GuildSettingsManager;
    public emotes: EmoteManager;
    public stickers: StickerManager;
    public commands: Collection<string, CommandType> = new Collection();
    private slashCommands: ApplicationCommandDataResolvable[] = [];

    public ra: RetroAchievementsManager;
    public bsky: BlueskyManager;

    constructor(shouldRegisterCommands: boolean = false) {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildExpressions,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent,
            ],
            allowedMentions: {
                parse: [],
                repliedUser: false,
            },
        });
        this.logger = new Logger();
        this.shouldRegisterCommands = shouldRegisterCommands;
        this.start();
        this.ra = new RetroAchievementsManager(this);
        this.scheduler = new Scheduler(this);
        this.messageHandler = new MessageHandler(this);
        this.settings = new GuildSettingsManager(this);
        this.emotes = new EmoteManager(this);
        this.stickers = new StickerManager(this);
        this.bsky = new BlueskyManager(this);
    }

    start(): void {
        this.setEvents();
        this.setCommands();
        this.login(discordAppToken);
    }

    async importFile(filePath: string): Promise<any> {
        return (await import(filePath))?.default;
    }

    private async setEvents(): Promise<void> {
        const eventFiles = await glob(`${__dirname}/../events/*{.ts,.js}`);
        eventFiles.forEach(async (filePath) => {
            const event: Event<keyof ClientEvents> = await this.importFile(`${__dirname}/../${filePath}`);
            this.on(event.event, event.run);
        });
    }

    private async setCommands(): Promise<void> {
        const commandFiles = await glob(`${__dirname}/../commands/*/*{.ts,.js}`);
        for (const file of commandFiles) {
            const command: CommandType = await this.importFile(`${__dirname}/../${file}`);
            if (!command.name) { return; }
            this.commands.set(command.name, command);
            this.slashCommands.push(command);
        };
    }

    async registerCommands(): Promise<void> {
        //this.logger.bot(`Registering ${this.slashCommands.length} slash commands...`, "red");
        const guildIds: Array<string> = await this.settings.getGuildIds();
        for (const guildId of guildIds) {
            await this.guilds.cache.get(guildId)?.commands.set(this.slashCommands);
        }
    }

    public async send(channelID: string, options: string | MessagePayload | MessageCreateOptions): Promise<void> {
        try {
            const channel: Channel = this.channels.cache.get(channelID) as TextChannel;
            await channel.send(options);
        } catch(err) {
            this.logger.err(err as string);
        }
    }

    public setStatus(status: string): void {
        this.user?.setActivity(status, { type: ActivityType.Custom });
    }

    public async setMilkStatus(countIn?: number): Promise<void> {
        const count: GlobalVar = (countIn) ? countIn : await this.settings.getGlobalVar("milks");
        const milkString: string = `${count} milks served fresh.`;
        this.setStatus(milkString);
    }
}