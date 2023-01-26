import { MessageCommandComponent } from "chironbot";
export let HelloWorldTextCommand = new MessageCommandComponent({
    name: "hello",
    description: "replies with 'world'",
    category: "main",
    enabled: true,
    permissions: (msg) => true,
    process: (msg, suffix) => {
        msg.reply("world! " + suffix);
        return "";
    }
});
export let HelloWorldEchoCommand = new MessageCommandComponent({
    name: "echo",
    description: "replies with 'world'",
    category: "main",
    enabled: true,
    permissions: (msg) => true,
    process: (msg, suffix) => {
        msg.reply(suffix);
        return "";
    }
});
