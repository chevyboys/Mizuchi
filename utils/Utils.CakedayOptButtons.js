const { MessageButton, MessageActionRow, } = require('discord.js');
const components = [
    new MessageActionRow()
        .addComponents(
            //add the upvote button
            new MessageButton()
                .setCustomId('cakedayopt-in')
                .setLabel(`opt-in to cakeday`)
                .setStyle("SECONDARY"),

            //add the check vote status button
            new MessageButton()
                .setCustomId('cakedayopt-out')
                .setLabel("opt-out of cakeday")
                .setStyle("SECONDARY"),

            new MessageButton()
                .setCustomId('cakedayinfo')
                .setLabel("")
                .setStyle("SECONDARY")
                .setEmoji("❔"),
        )
]
module.exports = components;
