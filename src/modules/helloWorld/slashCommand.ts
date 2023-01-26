import { SlashCommandComponent } from "chironbot";
import { SlashCommandBuilder } from "discord.js";

export let HelloWorldSlashCommand = new SlashCommandComponent({
    builder: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    enabled: true,
    category: "main",
    permissions: (interaction) => { return true },
    process: (interaction) => {
        interaction.isRepliable() ? interaction.reply("Pong!") : console.error("could not reply");
    }
})
export let HelloWorldSecondSlashCommand = new SlashCommandComponent({
    builder: new SlashCommandBuilder().setName('silent-ping').setDescription('Replies with Pong!'),
    enabled: true,
    category: "main",
    permissions: (interaction) => { return true },
    process: (interaction) => {
        interaction.isRepliable() ? interaction.reply({ content: "Pong!", ephemeral: true }) : console.error("could not reply");
    }
})