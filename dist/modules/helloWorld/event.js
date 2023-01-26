import { EventComponent } from "chironbot";
import { Events } from "discord.js";
export let HelloWorldEventComponent = new EventComponent({
    trigger: Events.MessageReactionAdd,
    enabled: true,
    process: async (MessageReaction, user) => {
        await MessageReaction.react();
    }
});
