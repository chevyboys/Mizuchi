const Augur = require("augurbot"),
    u = require("../utils/utils"),
    snowflakes = require('../config/snowflakes.json'),
    { MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js"),
    Attunements = require('../Judgement/AttunementRoles.json'),
    AUtils = require("../Judgement/Attunement Roles Utils")

let activeAttunements = [];

//general helper functions
let buildGenericEmbed = (interaction) => {
    return u.embed()
        .setAuthor({
            name: interaction.member?.displayName || interaction.author?.username, 
            iconURL: interaction.author?.displayAvatarURL({ size: 16 }),
            url: interaction.url
        })
        .setColor(interaction.member?.displayColor)

}

//Handlers for selecting your spire
let buildSelectSpire = async (interaction, replyInsteadOfUpdate) => {
    if (!replyInsteadOfUpdate) interaction.update({ embeds: [buildSpireSelectEmbed(interaction)], components: buildSpireSelectComponents(interaction, false), ephemeral: true })
    else await interaction.reply({ embeds: [buildSpireSelectEmbed(interaction)], components: buildSpireSelectComponents(interaction, false), ephemeral: true })
}
let buildSpireSelectEmbed = (interaction) => {
    return buildGenericEmbed(interaction).setDescription("Your judgement begins. Please let us know which spire you will be entering. Be warned, this choice once made cannot be undone.")
}
let buildSpireSelectComponents = (interaction) => {
    let SelectMenuOptions = [];
    //buildSelectMenu
    for (const spire of AUtils.spires()) {
        SelectMenuOptions.push({
            label: spire,
            description: `The ${spire} spire`,
            value: spire,
        })
    }
    SelectMenuOptions.push({
        label: "Random",
        description: `A Random spire`,
        value: "Random",
    })
    let rows = []
    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('JudgementSpireSelect')
                .setPlaceholder('Nothing    selected')
                .addOptions(SelectMenuOptions),
        );
    rows.push(row);
    return rows;
}
//handlers for when the spire has been selected
let buildSpireHasBeenSelectedEmbed = (interaction, spire) => {
    return buildGenericEmbed(interaction).setDescription(`You travel to the ${spire} spire.`)
}
let buildSpireHasBeenSelectedComponents = (interaction, spire) => {
    row = new MessageActionRow()
    row.addComponents(
        new MessageButton()
            .setCustomId(`spireHasBeenSelectedEnter`)
            .setLabel(`Enter the ${spire} spire`)
            .setStyle('SUCCESS')
    )
    row.addComponents(
        new MessageButton()
            .setCustomId(`spireHasBeenSelectedRetreat`)
            .setLabel(`Nope, Start over`)
            .setStyle('DANGER')
    )
    return [row];
}

let buildSpireHasBeenSelected = async (interaction) => {
    let spire;
    if(interaction.values[0].toLowerCase().indexOf("random") > -1) spire = AUtils.spires()[Math.floor(Math.random() * AUtils.spires().length)]
    else spire = interaction.values[0];
    interaction.update({embeds: [buildSpireHasBeenSelectedEmbed(interaction, spire)], components:buildSpireHasBeenSelectedComponents(interaction, spire), ephemeral: true})
}

//handle room one

let roomOneEmbed = (interaction) => {
    return buildGenericEmbed(interaction).setDescription(`The spire is currently closed`)
}
let roomOneComponents = (interaction) => {
    row = new MessageActionRow()
    row.addComponents(
        new MessageButton()
            .setCustomId(`spireHasBeenSelectedEnter`)
            .setLabel(`Try Again`)
            .setStyle('PRIMARY')
    )
    row.addComponents(
        new MessageButton()
            .setCustomId(`spireHasBeenSelectedRetreat`)
            .setLabel(`Start over`)
            .setStyle('DANGER')
    )
    return [row];
}
let roomOne = async (interaction) => {
    interaction.update({embeds: [roomOneEmbed(interaction)], components: roomOneComponents(interaction), ephemeral: true})
}

const Module = new Augur.Module()
    .addInteractionCommand({
        name: "judgement",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {
            // Akn
            buildSelectSpire(interaction, true);
        }
    })
    .addInteractionHandler({ customId: `JudgementSpireSelect`, process: buildSpireHasBeenSelected })
    .addInteractionHandler({ customId: `spireHasBeenSelectedEnter`, process: roomOne })
    .addInteractionHandler({ customId: `spireHasBeenSelectedRetreat`, process: buildSelectSpire });



module.exports = Module;