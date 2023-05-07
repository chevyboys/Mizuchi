import { ChironModule, MessageCommandComponent } from "chironbot";
import { HelloWorldContextMenu } from "./helloWorld/contextMenu";
import { HelloWorldEventComponent } from "./helloWorld/event";
import { HelloWorldMessageButtonSender, HelloWorldMessageComponentInteraction } from "./helloWorld/messageComponentInteraction";
import { HelloWorldScheduleComponent } from "./helloWorld/scheduledJobs";
import { HelloWorldSlashCommand, HelloWorldSecondSlashCommand } from "./helloWorld/slashCommand";
import { HelloWorldEchoCommand, HelloWorldTextCommand } from "./helloWorld/textCommand";
import { HelloWorldUnregisterSlashCommand, loaded, Reload, unloaded } from "./helloWorld/loadUnload";
import { Events, Message } from "discord.js";
import * as db from "../utils/Utils.Database";
let Database = db.Database;

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

Module.components.push(
    new MessageCommandComponent({
        name: "dbtest",
        trigger: Events.MessageCreate,
        description: "replies with 'world'",
        category: "main",
        enabled: true,
        permissions: (msg) => true,
        process: async (msg: Message, suffix: string) => {
            if (msg.guild?.id) {
                let guild = await Database.guild.findFirstOrThrow({
                    where: {
                      id: msg.guild.id,
                    },
                  });
                let user = await Database.user.findFirstOrThrow({
                    where: {
                      id: msg.author.id,
                    },
                  });
                console.log(guild)
                console.log(user);
            }
            msg.reply("echoing" + suffix)
            return "";
        }
    }),

);