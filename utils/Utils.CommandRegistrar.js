const Discord = require("discord.js"),
  config = require("../config/config.json"),
  snowflakes = require("../config/snowflakes.json"),
  { Routes } = require('discord-api-types/v9'),
  u = require("../utils/Utils.Generic"),
  fs = require('fs'),
  { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption } = require('@discordjs/builders'),
  { REST, DiscordAPIError } = require('@discordjs/rest');

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

let hasRegisteredCommandsThisRun = false

const registrar = {
  getCommandId: async (Module, commandName) => {
    let guild = await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer);
    guild.commands.cache.find((k, v) => v.name == commandName)

  },
  /**
   * Registers a guild application command to the primary guild
   * @param {Augur.Module} Module The Augur Module that is registering the commands
   * @param {(Discord.ApplicationCommand[]|Discord.ApplicationCommand|JSON)} commandArray 
   * @returns {Discord.ApplicationCommand[]} the currently registered commands. Use restrictGuildCommand() to restrict it's usage
   */

  registerGuildCommands: async (Module, commandArray) => {
    // Register API version with the token
    const rest = new REST({ version: '9' }).setToken(Module.config.token);

    let notJsonCommandArray;
    let parsedCommandArray;
    //ensure object, rather than JSON string
    if ((typeof commandArray === 'string' || commandArray instanceof String)) {
      if (IsJsonString(commandArray)) {
        notJsonCommandArray = JSON.parse(commandArray)
      } else throw new SyntaxError("Guild Command Registration error: Cannot parse the non-JSON string, " + commandArray)
    } else notJsonCommandArray = commandArray;

    //ensure array of objects, instead of indiviual object
    if (!Array.isArray(notJsonCommandArray)) {
      if (commandArray instanceof Discord.ApplicationCommand) {
        parsedCommandArray = [notJsonCommandArray];
      } else parsedCommandArray = notJsonCommandArray;
    } else parsedCommandArray = notJsonCommandArray;
    //parsedCommandArray should now be an array, rather than a JSON string or individual object. Now we can start registering commands:
    // Push the commands to discord (GUILD specific)
    let registeredCommands = []
    for (const command of parsedCommandArray) {
      command.toJSON()
      registeredCommands.push(await rest.post(Routes.applicationGuildCommands(Module.client.user.id, snowflakes.guilds.PrimaryServer), { body: command }));
    }
    return registeredCommands;
  },
  /**
   * Restricts the command passed in to only the allowed roles.
   * @param {Augur.Module} Module the augur module the command waw registered in
   * @param {Discord.ApplicationCommand} command the command to restrict
   * @param {Discord.Snowflake[]} [allowedRoles = []] the roles to still allow. Leave blank to disallow all
   */
  restrictGuildCommand: async (Module, command, allowedRoles = []) => {
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
  },
  SlashCommandBuilder: SlashCommandBuilder,
  SlashCommandSubcommandBuilder: SlashCommandSubcommandBuilder,
  SlashCommandStringOption: SlashCommandStringOption,

};

module.exports = registrar;