import { MessageComponentInteractionComponent, SlashCommandComponent } from "chironbot";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, SlashCommandBuilder } from "discord.js";


export const HelloWorldMessageComponentInteraction = new MessageComponentInteractionComponent({
    customId: (id) => id == "exampleid",
    enabled: true,
    permissions: (interaction) => true,
    process(interaction) {
        if (interaction instanceof ButtonInteraction) {
            interaction.reply({ content: "You pushed me!", ephemeral: true })
        }
    }
})

export const HelloWorldMessageButtonSender = new SlashCommandComponent({
    builder: new SlashCommandBuilder().setName("button").setDescription("Send a Button to be pushed"),
    enabled: true,
    category: "button",
    permissions: (interaction) => true,
    process: (interaction) => {

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('exampleid')
                    .setLabel('Click me!')
                    .setStyle(ButtonStyle.Primary),
            );
        if (interaction instanceof CommandInteraction) {
            interaction.reply({
                content: "Button button, who'll press the button?",
                components: [row]
            })
        }

    }
})