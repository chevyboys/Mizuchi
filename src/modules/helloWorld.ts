import { ChironModule, MessageCommandComponent, SlashCommandComponent } from "chironbot";
import { HelloWorldContextMenu } from "./helloWorld/contextMenu";
import { HelloWorldEventComponent } from "./helloWorld/event";
import { HelloWorldMessageButtonSender, HelloWorldMessageComponentInteraction } from "./helloWorld/messageComponentInteraction";
import { HelloWorldScheduleComponent } from "./helloWorld/scheduledJobs";
import { HelloWorldSlashCommand, HelloWorldSecondSlashCommand } from "./helloWorld/slashCommand";
import { HelloWorldEchoCommand, HelloWorldTextCommand } from "./helloWorld/textCommand";
import { HelloWorldUnregisterSlashCommand, loaded, Reload, unloaded } from "./helloWorld/loadUnload";
import { Events, Message, SlashCommandBuilder } from "discord.js";
import { SetupSlashCommand } from "./database/createGuild";

export const Module = new ChironModule({
    name: "hello world",
    components: [
        HelloWorldSlashCommand,
        HelloWorldTextCommand,
        HelloWorldEventComponent,
        HelloWorldContextMenu,
        HelloWorldMessageButtonSender,
        HelloWorldMessageComponentInteraction,
        HelloWorldScheduleComponent,
        HelloWorldUnregisterSlashCommand,
        HelloWorldEchoCommand,
        loaded,
        unloaded,
        Reload,
        HelloWorldSecondSlashCommand,
        SetupSlashCommand,
    ]
});

Module.components.push(
  new SlashCommandComponent({
    builder: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    enabled: true,
    category: "main",
    permissions: (interaction) => { return true },
    process: (interaction) => {
        interaction.isRepliable() ? interaction.reply("Pong!") : console.error("could not reply");
    }
})

);