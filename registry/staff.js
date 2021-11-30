const { SlashCommandBuilder } = require('@discordjs/builders');

commands = [
    new SlashCommandBuilder()
        .setName('staff')
        .setDescription('get a list of the current server staff members')
].map(command => command.toJSON());


module.exports = commands;