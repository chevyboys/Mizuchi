const Augur = require("augurbot"),
    u = require("../utils/utils"),
    snowflakes = require('../config/snowflakes.json'),
    { MessageActionRow, MessageButton } = require("discord.js"),
    Attunements = require('../Judgement/AttunementRoles.json');
const { embed } = require("../utils/utils");


const Module = new Augur.Module()
.addInteractionCommand({
    name: "judgement",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
        // Akn
        let embed = u.embed()
        .setAuthor(interaction.member?.displayName || interaction.author?.username, interaction.author?.displayAvatarURL({ size: 16 }), interaction.url)
        .setDescription(interaction.cleanContent)
        .setColor(interaction.member?.displayColor)
        .setTimestamp(interaction.createdAt);
        await interaction.reply({ embed: embed, ephemeral: true });
    }
});



module.exports = Module;