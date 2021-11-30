const { SlashCommandBuilder } = require('@discordjs/builders');

command =
    new SlashCommandBuilder()
        .setName('staff')
        .setDescription('get a list of the current server staff members')
        .toJSON();

module.exports = commands;