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
        .setAuthor(msg.member?.displayName || msg.author?.username, msg.author?.displayAvatarURL({ size: 16 }), msg.url)
        .setDescription(msg.cleanContent)
        .setColor(msg.member?.displayColor)
        .setTimestamp(msg.createdAt);
        await interaction.reply({ embed: embed, ephemeral: true });
    }
});



module.exports = Module;