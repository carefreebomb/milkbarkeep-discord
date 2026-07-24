import { InteractionCallbackResponse } from "discord.js";
import { Command } from "../../core/Command";

export default new Command({
    name: "ping",
    description: "Displays the bot's latency.",
    options: [],
    run: async (args): Promise<void> => {
        try {
            const reply: InteractionCallbackResponse<boolean> = await args.interaction.reply({
                content: "Pinging...",
                withResponse: true
            });
            const latency: number = reply.resource?.message
                ? reply.resource.message.createdTimestamp - args.interaction.createdTimestamp
                : 0;
            const socketPing: number = args.interaction.client.ws.ping;
            await args.interaction.editReply(
                `🏓 Pong!\n` +
                `**Latency:** ${latency} ms\n` +
                `**WebSocket:** ${socketPing} ms`
            );
        } catch (error: unknown) {
            args.client.logger.err(error as string);
            await args.interaction.editReply({ content: "Something went wrong with sending the message." });
        }
    }
});