import { ContextMenuCommandComponent } from "chironbot";
import { ApplicationCommandType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from "discord.js";
export const HelloWorldContextMenu = new ContextMenuCommandComponent({
    builder: new ContextMenuCommandBuilder().setName("Hello World").setType(ApplicationCommandType.Message),
    description: "Replies 'Hello World!' to any message it is used on",
    category: "general",
    enabled: true,
    permissions: (interaction) => { return true; },
    process(interaction) {
        if (interaction instanceof MessageContextMenuCommandInteraction) {
            interaction.reply("Hello World!");
        }
    }
});
