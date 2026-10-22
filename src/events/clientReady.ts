import { Events } from "discord.js";
import { Event } from "../core/Event";
import { client } from "..";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export default new Event(
    Events.ClientReady,
    async () => {
        const banner: string = readFileSync(
            join(__dirname, "../../assets/asciiBanner.ansi"),
            "utf8",
        ).replace(/\\033/g, "\x1b");
        const infoLine: string = `\x1b[31m » \x1b[37ma discord chatbot by \x1b[31m@carefreebomb`;
        
        client.logger.logWithoutTime(banner);
        client.logger.logWithoutTime(infoLine);
        client.logger.bar();

        if (client.shouldRegisterCommands) {
            client.registerCommands();
        }

        const readyStr: string = `${client.user?.tag} logged in and ready to serve!`;
        client.logger.bot(`${readyStr}`);

        client.scheduler.initialize();
        client.setStatus(" ");
        //await client.setMilkStatus();
    }
);