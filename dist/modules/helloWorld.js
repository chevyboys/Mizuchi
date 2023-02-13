import { ChironModule, MessageCommandComponent } from "chironbot";
import { HelloWorldContextMenu } from "./helloWorld/contextMenu";
import { HelloWorldEventComponent } from "./helloWorld/event";
import { HelloWorldMessageButtonSender, HelloWorldMessageComponentInteraction } from "./helloWorld/messageComponentInteraction";
import { HelloWorldScheduleComponent } from "./helloWorld/scheduledJobs";
import { HelloWorldSlashCommand, HelloWorldSecondSlashCommand } from "./helloWorld/slashCommand";
import { HelloWorldEchoCommand, HelloWorldTextCommand } from "./helloWorld/textCommand";
import { HelloWorldUnregisterSlashCommand, loaded, Reload, unloaded } from "./helloWorld/loadUnload";
import { Events } from "discord.js";
import * as Database from "../utils/Utils.Database";
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
    ]
});
Module.components.push(new MessageCommandComponent({
    name: "dbtest",
    trigger: Events.MessageCreate,
    description: "replies with 'world'",
    category: "main",
    enabled: true,
    permissions: (msg) => true,
    process: async (msg, suffix) => {
        if (msg.guild?.id) {
            let guild = await Database.Guild.get(msg.guild?.id);
            let user = await Database.User.get(msg.author.id);
            let question = await Database.Question.get("1054318740289888296");
            console.log(question);
            console.log(guild);
            console.log(user);
        }
        msg.reply("echoing" + suffix);
        return "";
    }
}));
