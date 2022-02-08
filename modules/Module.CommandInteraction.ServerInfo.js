const Augur = require("augurbot"),
    u = require("../utils/Utils.Generic");
const { BaseMessageComponent, MessageButton, MessageActionRow } = require("discord.js");
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

            let embed = u.embed().setTitle("Current Climbers Court Staff Members:").setDescription(`<@&${snowflakes.roles.Admin}>:` + "```" + Admin + "```\n\n" + `<@&${snowflakes.roles.Whisper}>:` + "```" + Mod + "```\n\n" + `<@&${snowflakes.roles.SoaringWings}>:` + "```" + SW + "```\n\n\n\n").setColor(color);

            interaction.editReply({ embeds: [embed] });
        }

    })
    .addInteractionCommand({
        name: "repo",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {
            let components = new MessageActionRow()
                .addComponents(
                    new MessageButton({
                        disabled: false,
                        label: "View My Code",
                        style: "LINK",
                        url: "https://github.com/chevyboys/Mizuchi/"
                    }))
                .addComponents(
                    new MessageButton({
                        disabled: false,
                        label: "Request a feature",
                        style: "LINK",
                        url: "https://github.com/chevyboys/Mizuchi/issues/new/choose"
                    }))
                .addComponents(
                    new MessageButton({
                        disabled: false,
                        label: "Report a bug",
                        style: "LINK",
                        url: "https://github.com/chevyboys/Mizuchi/issues/new/choose"
                    }))
                .addComponents(
                    new MessageButton({
                        disabled: false,
                        label: "See Current Projects",
                        style: "LINK",
                        url: "https://github.com/chevyboys/Mizuchi/projects/1"
                    }))
                .addComponents(
                    new MessageButton({
                        disabled: false,
                        label: "Support the Developers",
                        style: "LINK",
                        url: "https://www.patreon.com/GhostBotCode"
                    }));

            await interaction.reply({ content: "**__Helpful Links__**", components: [components], ephemeral: false });
        }

    })

const Registrar = require("../utils/Utils.CommandRegistrar");
//Register commands
let commands = [
    new Registrar.SlashCommandBuilder()
        .setName("repo")
        .setDescription("shows helpful links for the bot's info")
]
Module.addEvent("ready", async () => {
    commandResponse = await Registrar.registerGuildCommands(Module, commands)
});

module.exports = Module;
