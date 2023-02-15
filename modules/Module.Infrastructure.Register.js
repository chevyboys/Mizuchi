const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const fs = require('fs');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const snowflakes = require('../config/snowflakes.json');
const gs = require("../utils/Utils.GetGoogleSheetsAsJson");


const Module = new Augur.Module()
  .addEvent("ready", async () => {
    let authors = await gs(snowflakes.sheets.authors);
    // Build slash commands
    let commands = [
      new SlashCommandBuilder()
        .setName("character-info")
        .setDescription('Get character descriptions')
        .addStringOption(option =>
          option
            .setName('character')
            .setDescription('The character you are looking for')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('wiki')
        .setDescription('pull description from the wiki')
        .addStringOption(option =>
          option.setName('page')
            .setDescription('Phrase to search for')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addBooleanOption(option =>
          option.setName('advanced')
            .setDescription('Sends a longer page description')
            .setRequired(false)
        ),
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
            .addStringOption(option =>
              option
                .setName('answerer')
                .setDescription('The person you want to answer your question')
                .setRequired(true)
                .addChoices(...(authors.concat([{ Name: "any" }]).map((a) => {
                  return {
                    name: a.Name,
                    value: a.Name
                  }
                })
                ))
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('transfer')
            .setDescription('Get the 5 most popular questions!')
        ).addSubcommand(subcommand =>
          subcommand
            .setName('stats')
            .setDescription('Get the question queue stats')
            .addStringOption(option =>
              option
                .setName('answerer')
                .setDescription('The person you want to answer your question')
                .setRequired(true)
                .addChoices(...(authors.concat([{ Name: "any" }]).map((a) => {
                  return {
                    name: a.Name,
                    value: a.Name
                  }
                })
                ))
            ).addIntegerOption(option =>
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