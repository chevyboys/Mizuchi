const Augur = require("augurbot"),
    u = require("../utils/utils");
const snowflakes = require('../config/snowflakes.json');

const Module = new Augur.Module()
    .addCommand({
        name: "stafflist",
        aliases: ["staff", "staffinfo"],
        description: "Gets the current staff members and bot masters",
        permissions: () => {return true},
        process: async (msg) => {
            let SW = await msg.guild.members.cache.map((m) => { if (m.roles.cache.has(snowflakes.roles.SoaringWings)) return m.displayName || m.username }).filter(r => (r != null)).join(`\n`);

            let Mod = await msg.guild.members.cache.map((m) => { if (m.roles.cache.has(snowflakes.roles.Whisper) && !m.roles.cache.has(snowflakes.roles.Admin)) return m.displayName || m.username }).filter(r => (r != null)).join(`\n`);
            
            let Admin = await msg.guild.members.cache.map((m) => { if (m.roles.cache.has(snowflakes.roles.Admin)) return m.displayName || m.username }).filter(r => (r != null)).join(`\n`);
            
            let botMaster = await msg.guild.members.cache.map((m) => { if (m.roles.cache.has(snowflakes.roles.BotMaster)) return m.displayName || m.username }).filter(r => (r != null)).join(`\n`);

            let adminRole = (await msg.guild.roles.cache.get(snowflakes.roles.Admin));
            let whisperRole = (await msg.guild.roles.cache.get(snowflakes.roles.Whisper));
            let swRole = (await msg.guild.roles.cache.get(snowflakes.roles.SoaringWings));
            let botMasterRole = (await msg.guild.roles.cache.get(snowflakes.roles.BotMaster));
            let color = whisperRole.hexColor;
            
            let embed = u.embed().setTitle("Current Climbers Court Staff Members:").setDescription(`__**<@&${snowflakes.roles.Admin}>:**__` + "```" + Admin + "```\n\n" + `__**<@&${snowflakes.roles.Whisper}>:**__` + "```" + Mod + "```\n\n"+ `__**<@&${snowflakes.roles.SoaringWings}>:**__` + "```" + SW + "```\n\n\n\n").addField("Staff Assistants",`**<@&${snowflakes.roles.BotMaster}>**:` + "```" + botMaster + "```").setColor(color);
            
            msg.channel.send({ embeds: [embed]});
        }
    });

module.exports = Module;
