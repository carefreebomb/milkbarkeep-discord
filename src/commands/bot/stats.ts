import { EmbedBuilder, InteractionResponse, version as djsVersion } from "discord.js";
import { Command } from "../../core/Command";
import { Timestamps } from "../../core/Timestamps";

export default new Command({
    name: "stats",
    description: "Display general bot statistics.",
    options: [],
    run: async (args): Promise<void> => {
        const formatDuration = (seconds: number): string => {
            seconds = Math.floor(seconds);
            const days = Math.floor(seconds / 86400);
            seconds %= 86400;
            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            const minutes = Math.floor(seconds / 60);
            seconds %= 60;
            const parts: string[] = [];
            if (days) parts.push(`${days}d`);
            if (hours) parts.push(`${hours}h`);
            if (minutes) parts.push(`${minutes}m`);
            parts.push(`${seconds}s`);
            return parts.join(" ");
        }
        const uptime: string = formatDuration(process.uptime());
        const lastStart: number = Math.floor((Date.now() - process.uptime() * 1000) / 1000);
        const lastStartFull: string = Timestamps.longDateTime(lastStart);
        const lastStartRelative: string = Timestamps.relative(lastStart);
        const lastStartStr: string = `${lastStartFull} (${lastStartRelative})`;

        const memory: NodeJS.MemoryUsage = process.memoryUsage();
        const memoryMB: string = `${(memory.rss / 1024 / 1024).toFixed(1)} MB`;
        const websocket: string = args.client.ws.ping >= 0 ? `${args.client.ws.ping} ms` : "N/A";
        const nodeVersion: string = process.version;
        const servers: string = args.client.guilds.cache.size.toLocaleString();
        const users: string = args.client.users.cache.size.toLocaleString();

        const getLastCommit = async () => {
            const res: Response = await fetch("https://api.github.com/repos/carefreebomb/milkbarkeep-discord/commits?sha=main");
            const data = await res.json();
            const commit = data[0];
            const date: Date = new Date(commit.commit.author.date);
            return {
                hash: commit.sha.substring(0, 7),
                message: commit.commit.message,
                date,
                timestamp: Math.floor(date.getTime() / 1000)
            }
        }
        const commit = await getLastCommit();
        const commitUrl: string = `https://github.com/carefreebomb/milkbarkeep-discord/commit/${commit.hash}`;
        const commitStr = `[${commit.hash}](<${commitUrl}>) (${Timestamps.relative(commit.timestamp)})`;

        const embed = new EmbedBuilder()
            .setTitle("MilkBarkeep Statistics")
            .setDescription(`
                **GitHub:** [carefreebomb/milkbarkeep-discord](<https://github.com/carefreebomb/milkbarkeep-discord>)
                **Last Commit:** ${commitStr}

                **Last Start:** ${lastStartStr}
                **Uptime:** ${uptime}

                **Node.js:** ${nodeVersion}
                **discord.js:** ${djsVersion}

                **WebSocket:** ${websocket}
                **Memory:** ${memoryMB}

                **Servers:** ${servers}
                **Users:** ${users}
            `);

        try {
            const reply: InteractionResponse<boolean> = await args.interaction.reply({
                embeds: [ embed ]
            });
        } catch (error: unknown) {
            args.client.logger.err(error as string);
            await args.interaction.editReply({ content: "Something went wrong with sending the message." });
        }
    }
});