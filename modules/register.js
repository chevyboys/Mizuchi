const Augur = require("augurbot"),
  u = require("../utils/utils");
  const fs = require('fs');
  const { SlashCommandBuilder } = require('@discordjs/builders');
  const { REST, DiscordAPIError } = require('@discordjs/rest');
  const { Routes } = require('discord-api-types/v9');
  const { Client, MessageEmbed, Intents, MessageButton, MessageActionRow } = require('discord.js');
  const snowflakes = require('../config/snowflakes.json');

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
    ].map(command => command.toJSON());
    
    // Register API version with the token
    rest = new REST({ version: '9' }).setToken(Module.config.token);

    // Push the commands to discord (GUILD specific)
    tt = await rest.put(Routes.applicationGuildCommands(Module.client.user.id, snowflakes.guilds.PrimaryServer), { body: commands });

    // Restrict transfer command
    command = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)?.commands.fetch(tt[1].id);
    permissions = [
        {
            id: snowflakes.roles.Admin,
            type: 'ROLE',
            permission: true,
        },
        {
            id: snowflakes.roles.BotMaster,
            type: 'ROLE',
            permission: true,
        },
        {
            id: snowflakes.guilds.PrimaryServer,
            type: 'ROLE',
            permission: false,
        }
    ];
    await command.permissions.add({ permissions });
});
    module.exports = Module;