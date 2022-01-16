const Augur = require("augurbot"),
    u = require("../utils/utils");
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST, DiscordAPIError } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, MessageEmbed, Intents, MessageButton, MessageActionRow } = require('discord.js');
const snowflakes = require('../config/snowflakes.json');


let restrict = async (command, allowedRoles) => {
    // Restrict transfer command
    command = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)?.commands.fetch(command.id);
    permissions = [
        {
            id: snowflakes.guilds.PrimaryServer,
            type: 'ROLE',
            permission: false,
        }

    ];
    for (const role of allowedRoles) {
        let perms = {
            id: role,
            type: 'ROLE',
            permission: true,
        }
        permissions.push(perms)
    }
    await command.permissions.add({ permissions });
}

const Module = new Augur.Module()
    .addEvent("ready", async () => {
        // Build slash commands
        commands = [
            new SlashCommandBuilder()
                .setName('ask')
                .setDescription('Ask a question!')
                .addStringOption(option =>
                    option
                        .setName('question')
                        .setDescription('Your question!')
                        .setRequired(true)),
            new SlashCommandBuilder()
                .setName('transfer')
                .setDescription('Get the 5 most popular questions!')
                .addIntegerOption(option =>
                    option
                        .setName('questions')
                        .setDescription('The number of questions to transfer')
                        .setRequired(false)
                ),
            new SlashCommandBuilder()
                .setName('question-remove')
                .setDescription('Remove a question from the question queue')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('The id of the question you would like to nuke')
                        .setRequired(true)),
            new SlashCommandBuilder()
                .setName("judgement")
                .setDescription("Begin your journey to find your attunement.")

        ].map(command => command.toJSON());

        let registryFiles = fs.readdirSync('./registry/');
        let dummyFetch = (await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer)).commands.fetch();
        let guild = await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer);
        let commandCache = guild.commands.cache;
        for (const file of registryFiles) {
            if (file.indexOf(".js") > -1) {
                let fileToRegister = file;
                if (!commandCache.filter(c => c.name == file.name).size > 0) {
                    const commandData = require(`../registry/${fileToRegister}`);
                    commands.push(commandData);
                }
            }
        }
        // Register API version with the token
        rest = new REST({ version: '9' }).setToken(Module.config.token);

        // Push the commands to discord (GUILD specific)
        tt = await rest.put(Routes.applicationGuildCommands(Module.client.user.id, snowflakes.guilds.PrimaryServer), { body: commands });

        // Restrict transfer command
        await restrict(tt[1], [snowflakes.roles.Admin, snowflakes.roles.WorldMaker])
        //restrict the question remove command
        await restrict(tt[2], [snowflakes.roles.Admin, snowflakes.roles.Whisper, snowflakes.roles.BotMaster])
        //restrict judgement while in development
        await restrict(tt[3], [snowflakes.roles.Admin, snowflakes.roles.Whisper, snowflakes.roles.BotMaster, snowflakes.roles.SoaringWings])
        //restrict spoiler

    });
module.exports = Module;