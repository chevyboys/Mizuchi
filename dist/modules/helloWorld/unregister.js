import { ChironClient, SlashCommandComponent from "chironbot";
import { SlashCommandBuilder } from "discord.js";
export let HelloWorldUnregisterSlashCommand = new SlashCommandComponent({
    builder: new SlashCommandBuilder().setName('unregister').setDescription('jetisons this module'),
    enabled: true,
    category: "main",
    permissions: (interaction) => { return true; },
    process: async (interaction) => {
        if (HelloWorldUnregisterSlashCommand.module?.client instanceof ChironClient)
            await HelloWorldUnregisterSlashCommand.module?.client?.modules.unregister(HelloWorldUnregisterSlashCommand.module);
        interaction.isRepliable() ? await interaction.reply("Jettison the module!") : console.error("could not reply");
        console.log("Jettisoned");
    }
});

