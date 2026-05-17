const { Client } = require('discord.js');
const fs = require('fs');
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const gs = require("./utils/Utils.GetGoogleSheetsAsJson");
const UtilsDatabase = require("./utils/Utils.Database");

const tavareConfig = require("./config/config_tavare.json");
const anathemaConfig = require("./config/config_anathema.json");
tavareConfig.snowflakes = require("./config/snowflakes.json");
anathemaConfig.snowflakes = require("./config/snowflakes_anathema.json");

// Intent 1 (GUILDS) is required to let the database sync guilds on startup
const mainClient = new Client({ intents: 1 });
mainClient.config = tavareConfig; // Inject config for Utils.Database.js

mainClient.once('ready', async () => {
  console.log(`[Main Bot] Logged in as ${mainClient.user.tag}`);

  try {
    console.log("Connecting to the database and syncing guilds...");
    await UtilsDatabase.init({ client: mainClient });

    console.log("Fetching dynamic data from DB and Sheets...");
    let rollData = await gs(tavareConfig.snowflakes.sheets.rolls, true);
    let authors = await gs(tavareConfig.snowflakes.sheets.authors);

    let currencies = await UtilsDatabase.Economy.getValidCurrencies();
    let currencyChoices = currencies.slice(0, 25).map(c => ({ name: c.name, value: String(c.id) }));
    let authorChoices = authors.concat([{ Name: "any" }]).map(a => ({ name: a.Name, value: a.Name }));

    // ==========================================
    // Build Dynamic Roll Command
    // ==========================================
    let rollCommand = new SlashCommandBuilder()
      .setName("roll")
      .setDescription("Roll some dice")
      .addSubcommand(sub => sub.setName("dice").setDescription("Roll some dice using dice notation").addStringOption(opt => opt.setName("dice").setDescription("The dice to roll, or 'help' for more information").setRequired(true)))
      .addSubcommand(sub => sub.setName("help").setDescription("Get help with dice notation"));

    if (rollData) {
      Object.keys(rollData).forEach(key => {
        rollCommand.addSubcommand(sub => sub.setName(key).setDescription(`Get a random ${key} entry`));
      });
    }

    // ==========================================
    // 1. BUILD COMMON COMMANDS
    // ==========================================
    let commonCommands = [
      new SlashCommandBuilder().setName('wiki').setDescription('pull description from the wiki')
        .addStringOption(o => o.setName('page').setDescription('Phrase to search for').setAutocomplete(true).setRequired(true))
        .addBooleanOption(o => o.setName('advanced').setDescription('Sends a longer page description').setRequired(false)),
      new SlashCommandBuilder().setName("tone").setDescription("View a list of tone tags"),
      new SlashCommandBuilder().setName("repo").setDescription("View my code!"),
      new SlashCommandBuilder().setName("links").setDescription("Handy links to things around the fandom"),
      new SlashCommandBuilder().setName("pulse").setDescription("Get the bot's and discord's pulse")
        .addBooleanOption(o => o.setName("verbose").setDescription("set to true if you want lots of extra info").setRequired(false)),
      rollCommand
    ].map(command => command.toJSON());

    let commonRegistry = fs.readdirSync('./registry/Common').filter(f => f.endsWith('.js') || f.endsWith('.json'));
    for (const file of commonRegistry) {
      if (file === "pride.json" && new Date().getMonth() != 5) continue;
      commonCommands.push(require(`./registry/Common/${file}`));
    }

    // ==========================================
    // 2. BUILD TAVARE COMMANDS
    // ==========================================
    let tavareCommands = [
      new SlashCommandBuilder().setName("character-info").setDescription('Get character descriptions').addStringOption(o => o.setName('character').setDescription('The character you are looking for').setRequired(true)),
      new SlashCommandBuilder().setName('question').setDescription('Interact with our Questions Queue')
        .addSubcommand(sub => sub.setName('ask').setDescription('Ask a question!')
          .addStringOption(o => o.setName('question').setDescription('Your question!').setRequired(true))
          .addStringOption(o => o.setName('answerer').setDescription('The person you want to answer your question').setRequired(true).addChoices(...authorChoices))
        )
        .addSubcommand(sub => sub.setName('transfer').setDescription('Get the 5 most popular questions!'))
        .addSubcommand(sub => sub.setName('stats').setDescription('Get the question queue stats')
          .addStringOption(o => o.setName('answerer').setDescription('The person you want to answer your question').setRequired(true).addChoices(...authorChoices))
          .addIntegerOption(o => o.setName('page').setDescription('The page to select from, default 1').setRequired(false))
        ),
      new SlashCommandBuilder().setName("thank").setDescription("Thanks someone for helping out")
        .addUserOption(o => o.setName('helper').setDescription('the person to thank').setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("the great thing the person did!").setRequired(true))
        .addIntegerOption(o => o.setName("days").setRequired(false).setDescription("The number of days to give an xp boost")),
      new SlashCommandBuilder().setName("welcome").setDescription("Edits the server greeting.")
        .addSubcommand(sub => sub.setName("embed").setDescription("Appends and Embed to welcome messages until they are reset")
          .addStringOption(o => o.setName("title").setDescription("The title of the embed").setRequired(true))
          .addStringOption(o => o.setName("image-url").setDescription("The url of the image").setRequired(true))
          .addStringOption(o => o.setName("description").setDescription("the description of the embed").setRequired(true))
        )
        .addSubcommand(sub => sub.setName("override").setDescription("Replaces the welcome message").addStringOption(o => o.setName("text").setDescription("The text to adjust welcome messages with").setRequired(true)))
        .addSubcommand(sub => sub.setName("append").setDescription("Adds text to the end of welcome messages").addStringOption(o => o.setName("text").setDescription("The text to adjust welcome messages with").setRequired(true)))
        .addSubcommand(sub => sub.setName("prepend").setDescription("Adds text to the end of welcome messages").addStringOption(o => o.setName("text").setDescription("The text to adjust welcome messages with").setRequired(true)))
        .addSubcommand(sub => sub.setName("reset").setDescription("Resets welcome messages to be the default"))
    ].map(command => command.toJSON());

    // Add Raw JSON Economy Command
    tavareCommands.push({
      "name": "economy",
      "description": "Manage and view currency balances",
      "options": [
        { "type": 1, "name": "balance", "description": "Check your currency balances or someone else's balance", "options": [{ "type": 6, "name": "user", "description": "The user to check the balance of", "required": false }] },
        { "type": 1, "name": "leaderboard", "description": "Check the currency leaderboard for a specific currency", "options": [] },
        { "type": 1, "name": "give", "description": "Give a specific amount of currency to a user", "options": [{ "type": 6, "name": "user", "description": "The user to give the currency to", "required": true }, { "type": 4, "name": "amount", "description": "The amount of currency to give", "required": true }, { "type": 3, "name": "currency", "description": "The currency to give", "required": true, "choices": currencyChoices }] },
        { "type": 1, "name": "grant", "description": "Grant a specific amount of currency to a user (admin only)", "options": [{ "type": 6, "name": "user", "description": "The user to grant the currency to", "required": true }, { "type": 4, "name": "amount", "description": "The amount of currency to grant", "required": true }, { "type": 3, "name": "currency", "description": "The currency to grant", "required": true, "choices": currencyChoices }] },
        { "type": 1, "name": "shop", "description": "View the shop and purchase items", "options": [] }
      ]
    });

    let tavareRegistry = fs.readdirSync('./registry/Tavare').filter(f => f.endsWith('.js') || f.endsWith('.json'));
    for (const file of tavareRegistry) {
      tavareCommands.push(require(`./registry/Tavare/${file}`));
    }

    // ==========================================
    // 3. PUSH COMMANDS TO DISCORD
    // ==========================================
    let finalMainCommands = [...commonCommands, ...tavareCommands];
    console.log(`[Main Bot] Registering ${finalMainCommands.length} commands to Discord...`);
    await mainClient.application.commands.set(finalMainCommands);
    console.log(`[Main Bot] Successfully registered commands!`);

    mainClient.destroy(); // Log out main bot

    // --- Deploy to Anathema Bot ---
    const anathemaClient = new Client({ intents: 1 });
    anathemaClient.once('ready', async () => {
      console.log(`[Anathema] Logged in as ${anathemaClient.user.tag}`);

      let anathemaCommands = [...commonCommands];
      let anathemaRegistry = fs.readdirSync('./registry/Anathema').filter(f => f.endsWith('.js') || f.endsWith('.json'));
      for (const file of anathemaRegistry) {
        if (file === "pride.json" && new Date().getMonth() != 5) continue;
        anathemaCommands.push(require(`./registry/Anathema/${file}`));
      }

      console.log(`[Anathema] Registering ${anathemaCommands.length} commands to Discord...`);
      await anathemaClient.application.commands.set(anathemaCommands);
      console.log(`[Anathema] Successfully registered commands!`);

      process.exit(0); // Exit the deployment script completely
    });

    console.log("Logging Anathema bot into Discord...");
    anathemaClient.login(anathemaConfig.token);

  } catch (error) {
    console.error("An error occurred during deployment:", error);
    process.exit(1);
  }
});

console.log("Logging Main bot into Discord to initialize DB...");
mainClient.login(tavareConfig.token);