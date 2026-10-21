import { Events } from "discord.js";
import { Event } from "../core/Event";
import { client } from "..";

export default new Event(
    Events.ClientReady,
    async () => {
        const asciiText = "" +
        "___  ________ _      _   ________  ___  ______ _   __ _____ ___________ \n" +
        "|  \\/  |_   _| |    | | / /| ___ \\/ _ \\ | ___ \\ | / /|  ___|  ___| ___ \\ \n" +
        "| .  . | | | | |    | |/ / | |_/ / /_\\ \\| |_/ / |/ / | |__ | |__ | |_/ / \n" +
        "| |\\/| | | | | |    |    \\ | ___ \\  _  ||    /|    \\ |  __||  __||  __/ \n" +
        "| |  | |_| |_| |____| |\\  \\| |_/ / | | || |\\ \\| |\\  \\| |___| |___| | \n" +
        "\\_|  |_/\\___/\\_____/\\_| \\_/\\____/\\_| |_/\\_| \\_\\_| \\_/\\____/\\____/\\_|";

        const asciiText2 = "\n" +
            "█▄ ▄█ ▀█▀ █    █ ▄▀ █▀▀▄ ▄▀▀▄ █▀▀▄ █ ▄▀ █▀▀▀ █▀▀▀ █▀▀▄ \n" +
            "█ ▀ █  █  █    █▀▄  █▀▀▄ █▀▀█ █▀█  █▀▄  █▀▀  █▀▀  █▀▀  \n" +
            "▀   ▀ ▀▀▀ ▀▀▀▀ ▀  ▀ ▀▀▀  ▀  ▀ ▀  ▀ ▀  ▀ ▀▀▀▀ ▀▀▀▀ ▀    ";

        const arrow: string | undefined = "↪".codePointAt(0)?.toString(16);
        const infoLine: string = `\x1b[91m » \x1b[37ma discord chatbot by \x1b[91m@carefreebomb`;
        
        client.logger.logWithoutTime(asciiText2);
        client.logger.logWithoutTime(infoLine);
        client.logger.bar();

        if (client.shouldRegisterCommands) {
            client.registerCommands();
        }

        const readyStr: string = `${client.user?.tag} logged in and ready to serve!`;
        client.logger.bot(`${readyStr}`);

        client.scheduler.initialize();
        await client.setStatus(" ");
        //await client.setMilkStatus();
    }
);