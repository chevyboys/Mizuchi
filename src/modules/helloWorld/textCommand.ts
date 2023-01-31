import { MessageCommandComponent } from "chironbot";
import { Events, Message } from "discord.js";

export let HelloWorldTextCommand = new MessageCommandComponent({
    name: "hello",
    trigger: Events.MessageCreate,
    description: "replies with 'world'",
    category: "main",
    enabled: true,
    permissions: (msg) => true,
    process: (msg: Message, suffix: string) => {
        msg.reply("world! " + suffix)
        return "";
    }
})

export let HelloWorldEchoCommand = new MessageCommandComponent({
    name: "echo",
    trigger: Events.MessageCreate,
    description: "replies with 'world'",
    category: "main",
    enabled: true,
    permissions: (msg) => true,
    process: (msg: Message, suffix: string) => {
        msg.reply(suffix)
        return "";
    }
})