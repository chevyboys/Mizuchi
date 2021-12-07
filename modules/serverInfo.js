const Augur = require("augurbot"),
    u = require("../utils/utils");
const snowflakes = require('../config/snowflakes.json');

const Module = new Augur.Module()
    .addInteractionCommand({
        name: "staff",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {
            await interaction.deferReply?.({ ephemeral: false });
            let SW = await interaction.guild.members.cache.map((m) => { if (m.roles.cache.has(snowflakes.roles.SoaringWings)) return m.displayName || m.username }).filter(r => (r != null)).join(`\n`);

            let Mod = await interaction.guild.members.cache.map((m) => { if (m.roles.cache.has(snowflakes.roles.Whisper) && !m.roles.cache.has(snowflakes.roles.Admin)) return m.displayName || m.username }).filter(r => (r != null)).join(`\n`);
            
            let Admin = await interaction.guild.members.cache.map((m) => { if (m.roles.cache.has(snowflakes.roles.Admin)) return m.displayName || m.username }).filter(r => (r != null)).join(`\n`);

            let whisperRole = (await interaction.guild.roles.cache.get(snowflakes.roles.Whisper));

            let color = whisperRole.hexColor;
            
            let embed = u.embed().setTitle("Current Climbers Court Staff Members:").setDescription(`<@&${snowflakes.roles.Admin}>:` + "```" + Admin + "```\n\n" + `<@&${snowflakes.roles.Whisper}>:` + "```" + Mod + "```\n\n"+ `<@&${snowflakes.roles.SoaringWings}>:` + "```" + SW + "```\n\n\n\n").setColor(color);
            
            interaction.editReply({ embeds: [embed]});
        }

    });

module.exports = Module;
