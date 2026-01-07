const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const fs = require('fs');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const snowflakes = require('../config/snowflakes.json');
const gs = require("../utils/Utils.GetGoogleSheetsAsJson");








const Module = new Augur.Module()
  .addEvent("ready", async () => {
    let authors = await gs(snowflakes.sheets.authors);
    let rollData = await gs(snowflakes.sheets.rolls, true);
    let rollCommand = new SlashCommandBuilder()
      .setName("roll")
      .setDescription("Roll some dice")
      .addSubcommand(subcommand =>
        subcommand
          .setName("dice")
          .setDescription("Roll some dice using dice notation")
          .addStringOption(option =>
            option
              .setName("dice")
              .setDescription("The dice to roll, or 'help' for more information")
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName("help")
          .setDescription("Get help with dice notation")
      )
    //dynamically add subcommands based on rollData keys
    Object.keys(rollData).forEach(key => {
      rollCommand.addSubcommand(subcommand =>
        subcommand
          .setName(key)
          .setDescription(`Get a random ${key} entry`)
      )
    });


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
      rollCommand,
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
        //if it isn't june, don't register the pride.json file
        //if (file == "pride.json" && new Date().getMonth() != 5) continue;
        let fileToRegister = file;
        const commandData = require(`../registry/${fileToRegister}`);
        commands.push(commandData);
      }
    }

    console.log("registering commands, please wait");
    u.errorLog.send({ embeds: [u.embed().setColor("BLUE").setDescription("Registering Commands")] });
    // Push the commands to discord (GUILD specific)
    try {
      await guild.commands.set(commands)
    } catch (error) {
      // check for strings like
      //Ready Handler: /home/tavare/Mizuchi/modules/Module.Infrastructure.Register.js
      //Trace: DiscordAPIError: Invalid Form Body
      //13.description: Must be 100 or fewer in length.
      console.error("There was an error registering commands: ", error);
      if (error.toString().indexOf("DiscordAPIError") > -1) {
        //get the part after "DiscordAPIError:, if its invalid form body, parse out the command number
        let errorMessage = error.toString().split("DiscordAPIError:")[1].trim();
        if (errorMessage.indexOf("Invalid Form Body") > -1) {
          let fieldErrors = errorMessage.split("\n").slice(1); //skip the first line
          fieldErrors.forEach(fe => {
            let match = fe.match(/(\d+)\.(\w+): (.+)/); //matches patterns like "13.description: Must be 100 or fewer in length."
            if (match) {
              let commandIndex = parseInt(match[1]);
              let fieldName = match[2];
              let issue = match[3];
              let command = commands[commandIndex];
              console.error(`Command "${command.name}" has an issue with its "${fieldName}": ${issue}`);
              u.errorLog.send({
                embeds: [u.embed().setColor("RED").setTitle("Command Registration Error")
                  .setDescription(`Command "**${command.name}**" has an issue with its "**${fieldName}**": ${issue}`)]
              });
            }
          });
        }

      }

    }

    console.log("command registration complete")
    u.errorLog.send({ embeds: [u.embed().setColor("BLUE").setDescription("Command Registration Complete!")] });
  });
module.exports = Module;