const Augur = require("augurbot"),
    u = require("../utils/utils"),
    snowflakes = require('../config/snowflakes.json'),
    { MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js"),
    Attunements = require('../Judgement/AttunementRoles.json'),
    AUtils = require("../Judgement/Attunement Roles Utils")

let selectSpire = async (interaction) => {
    interaction.reply({content: `you have selected the ${interaction.value} spire`, ephemeral: true})
}


let buildSpireSelectEmbed = (interaction) => {
    return u.embed()
        .setAuthor(interaction.member?.displayName || interaction.author?.username, interaction.author?.displayAvatarURL({ size: 16 }), interaction.url)
        .setDescription("Your judgement begins. Please select a spire.")
        .setColor(interaction.member?.displayColor)
        .setTimestamp(interaction.createdAt);
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

const Module = new Augur.Module()
    .addInteractionCommand({
        name: "judgement",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {
            // Akn
            await interaction.reply({ embeds: [buildSpireSelectEmbed(interaction)], components: buildSpireSelectComponents(interaction, false), ephemeral: true });
        }
    })
    .addInteractionHandler({ customId: `JudgementSpireSelect`, process: selectSpire });



module.exports = Module;