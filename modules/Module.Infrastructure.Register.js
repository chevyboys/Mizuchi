const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const fs = require('fs');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { REST, DiscordAPIError } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, MessageEmbed, Intents, MessageButton, MessageActionRow } = require('discord.js');
const snowflakes = require('../config/snowflakes.json');

const Module = new Augur.Module()
  .addEvent("ready", async () => {
    // Build slash commands
    let commands = [
      new SlashCommandBuilder()
        .setName('question')
        .setDescription('Interact with our Questions Queue')
        .addSubcommand(subcommand =>
          subcommand
            .setName('ask')
            .setDescription('Ask a question!')
            .addStringOption(option =>
              option
                .setName('question')
                .setDescription('Your question!')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('transfer')
            .setDescription('Get the 5 most popular questions!')
            .addIntegerOption(option =>
              option
                .setName('questions')
                .setDescription('The number of questions to transfer')
                .setRequired(false)
            ),
        ).addSubcommand(subcommand =>
          subcommand
            .setName('stats')
            .setDescription('Get the question queue stats')
            .addIntegerOption(option =>
              option
                .setName('page')
                .setDescription('The page to select from, default 1')
                .setRequired(false)
            ),
        ),
      new SlashCommandBuilder().setName("tone")
        .setDescription("Veiw a list of tone tags"),
      new SlashCommandBuilder().setName("repo")
        .setDescription("Veiw my code!"),
      new SlashCommandBuilder().setName("links")
        .setDescription("Handy links to things around the fandom"),
      new SlashCommandBuilder()
        .setName("judgement")
        .setDescription("Begin your journey to find your attunement."),
      new SlashCommandBuilder()
        .setName("thank")
        .setDescription("Thanks someone for helping out")
        .addUserOption(option =>
          option
            .setName('helper')
            .setDescription('the person to thank')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("reason")
            .setDescription("the great thing the person did!")
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName("days")
            .setRequired(false)
            .setDescription("The number of days to give an xp boost")
        ),
      new SlashCommandBuilder()
        .setName("roll")
        .setDescription("roles a dice of any reasonable size")
        .addStringOption(option =>
          option
            .setName("dice")
            .setDescription("The dice you want to roll. If you aren't sure how, instead enter 'help'")
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName("gmroll")
        .setDescription("roles a dice of any reasonable size")
        .addStringOption(option =>
          option
            .setName("dice")
            .setDescription("The dice you want to roll in private. If you aren't sure how, instead enter 'help'")
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName("pulse")
        .setDescription("Get's the bot's and discord's pulse")
        .addBooleanOption(option =>
          option
            .setName("verbose")
            .setDescription("set to true if you want lots of extra info")
            .setRequired(false)
        ),
      new SlashCommandBuilder()
        .setName("welcome")
        .setDescription("Edits the server greeting.")
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("embed")
            .setDescription("Appends and Embed to welcome messages until they are reset")
            .addStringOption(new SlashCommandStringOption()
              .setName("title")
              .setDescription("The title of the embed")
              .setRequired(true)
            )
            .addStringOption(new SlashCommandStringOption()
              .setName("image-url")
              .setDescription("The url of the image")
              .setRequired(true)
            )
            .addStringOption(new SlashCommandStringOption()
              .setName("description")
              .setDescription("the description of the embed")
              .setRequired(true)
            )
        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("override")
            .setDescription("Replaces the welcome message")
            .addStringOption(new SlashCommandStringOption()
              .setName("text")
              .setDescription("The text to adjust welcome messages with")
              .setRequired(true)
            )

        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("append")
            .setDescription("Adds text to the end of welcome messages")
            .addStringOption(new SlashCommandStringOption()
              .setName("text")
              .setDescription("The text to adjust welcome messages with")
              .setRequired(true)
            )

        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("prepend")
            .setDescription("Adds text to the end of welcome messages")
            .addStringOption(new SlashCommandStringOption()
              .setName("text")
              .setDescription("The text to adjust welcome messages with")
              .setRequired(true)
            )

        )
        .addSubcommand(
          new SlashCommandSubcommandBuilder()
            .setName("reset")
            .setDescription("Resets welcome messages to be the default")
        )
    ].map(command => command.toJSON());

    u.errorLog.send({ embeds: [u.embed().setColor("BLUE").setDescription("Reading Commands, preparing to register")] });

    let registryFiles = fs.readdirSync('./registry/');
    let dummyFetch = (await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer)).commands.fetch();
    let guild = await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer);
    let commandCache = guild.commands.cache;
    for (const file of registryFiles) {
      if (file.indexOf(".js") > -1) {
        let fileToRegister = file;
        const commandData = require(`../registry/${fileToRegister}`);
        commands.push(commandData);
      }
    }

    console.log("registering commands, please wait");
    u.errorLog.send({ embeds: [u.embed().setColor("BLUE").setDescription("Registering Commands")] });
    // Push the commands to discord (GUILD specific)
    await guild.commands.set(commands)

    console.log("command registration complete")
    u.errorLog.send({ embeds: [u.embed().setColor("BLUE").setDescription("Command Registration Complete!")] });
  });
module.exports = Module;