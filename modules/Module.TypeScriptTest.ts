import { AugurModule } from 'augurbot';
import * as snowflakes from '../config/snowflakes.json';
import { BaseCommandInteraction, InteractionReplyOptions } from 'discord.js';

const Module = new AugurModule();
console.log("imported");

Module.addInteractionCommand({
    name: "echo",
    description: "echo's a message",
    guildId: snowflakes.guilds.TestServer,
    process: async (interaction: BaseCommandInteraction) => {
        interaction.
       
        const echo = interaction?.options?.get("content").value.toString();

        const reply: InteractionReplyOptions = { content: echo }

        console.log("hi");
        await interaction.reply(echo);
    }
})

module.exports = Module;