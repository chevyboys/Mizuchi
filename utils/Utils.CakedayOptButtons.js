const { MessageButton, MessageActionRow, } = require('discord.js');
const components = [
    new MessageActionRow()
        .addComponents(
            //add the upvote button
            new MessageButton()
                .setCustomId('cakedayopt-in')
                .setLabel(`Opt-in to Cakedays!`)
                .setStyle("SECONDARY"),

            //add the check vote status button
            new MessageButton()
                .setCustomId('cakedayopt-out')
                .setLabel("Opt-out of Cakedays")
                .setStyle("SECONDARY"),

            new MessageButton()
                .setCustomId('cakedayinfo')
                .setLabel("")
                .setStyle("SECONDARY")
                .setEmoji("ℹ"),
        )
]
module.exports = components;
