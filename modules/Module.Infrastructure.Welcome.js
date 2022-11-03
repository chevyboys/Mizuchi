const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  db = require("../utils/Utils.Database"),
  gs = require("../utils/Utils.GetGoogleSheetsAsJson");
snowflakes = require("../config/snowflakes.json");
const fs = require('fs');
const CakedayOptButtons = require("../utils/Utils.CakedayOptButtons");

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

let welcomeStringCommandOverride = (welcomeMsgObject) => {
  let overrideObject = JSON.parse(fs.readFileSync(`./data/welcome/welcomeOveride.json`));
  switch (overrideObject.type) {
    case "disabled":
      return welcomeMsgObject;
    case "prepend":
      welcomeMsgObject.content = overrideObject.welcomeString + "\n" + welcomeMsgObject.content;
      return welcomeMsgObject;
    case "append":
      welcomeMsgObject.content = welcomeMsgObject.content + "\n" + overrideObject.welcomeString;
      return welcomeMsgObject;
    case "override":
      welcomeMsgObject.content = overrideObject.welcomeString;
      return welcomeMsgObject;
    case "embed":
      welcomeMsgObject.embeds = [u.embed().setColor("#55aaFF").setAuthor({ name: overrideObject.embedTitle, iconURL: overrideObject.embedImgUrl }).setDescription(overrideObject.welcomeString)]
      return welcomeMsgObject;
    default: throw new Error(`Improper welcome string override type. ${overrideObject.type} is not one of ${JSON.stringify(overrideObject.validTypes)}`);
  }
}
/**
 * 
 * @param {string} string 
 * @param {*} member 
 */
function welcomeEscapeSequencesParse(string, member) {
  let parsed1 = string.replaceAll("[name]", "[honorific] " + member.displayName);
  let parsed2 = parsed1.replaceAll("[intentionally blank]", "");
  let parsed3;
  for (const key in snowflakes.channels) {
    if (Object.hasOwnProperty.call(snowflakes.channels, key)) {
      const element = snowflakes.channels[key];
      parsed3 = parsed2.replaceAll(`[#${key.toLowerCase()}]`, `<#${element}>`)
    }
  }
  for (const key in snowflakes.roles) {
    if (Object.hasOwnProperty.call(snowflakes.roles, key)) {
      const element = snowflakes.roles[key];
      parsed3 = parsed3.replaceAll(`[@${key.toLowerCase()}]`, `<@&${element}>`)
    }
  }
  return parsed3.replaceAll("[comma]", ",");
}

let lastHonorific;
let lastGreeting;
let lastPrompt;
let lastDirections;

/**
 * returns an object containing a Greetings, Prompt, and Directions strings using a google sheet
 * @param {Member} member 
 * @returns {object}
 */
async function generateWelcomeObject(member) {
  const rawWelcome = await gs(snowflakes.sheets.welcome);
  let Honorific = u.rand(rawWelcome.filter(row => row.Honorific && row.Honorific != "" && row.Honorific != lastHonorific).map(row => welcomeEscapeSequencesParse(row.Honorific, member))).toLowerCase();
  lastHonorific = Honorific;
  let welcomeObject = {
    Greeting: u.rand(rawWelcome.filter(row => row.Greeting && row.Greeting != "" && row.Greeting != lastGreeting).map(row => welcomeEscapeSequencesParse(row.Greeting, member))).replaceAll('[honorific]', Honorific),
    Prompt: u.rand(rawWelcome.filter(row => row.Prompt && row.Prompt != "" && row.Prompt != lastPrompt).map(row => welcomeEscapeSequencesParse(row.Prompt, member))).replaceAll('[honorific]', Honorific),
    Directions: u.rand(rawWelcome.filter(row => row.Directions && row.Directions != "" && row.Directions != lastDirections).map(row => welcomeEscapeSequencesParse(row.Directions, member))).replaceAll('[honorific]', Honorific),
  }
  //assert that we don't immedietly duplicate
  lastGreeting = welcomeObject.Greeting.replaceAll(member.displayName, "[name]").replaceAll(Honorific, "").replaceAll("  ", " ");
  lastPrompt = welcomeObject.Prompt;
  lastDirections = welcomeObject.Directions;
  return welcomeObject;
}


const Module = new Augur.Module()
  .addEvent("messageCreate", async (msg) => {

    if (msg.type != "GUILD_MEMBER_JOIN" || msg.author.bot) return;
    try {
      let member = await msg.guild.members.fetch(msg.author);
      //Make sure we are in the primary server
      if (member.guild.id != snowflakes.guilds.PrimaryServer) return;


      //set up common variables we will need in a bit
      let guild = member.guild;
      let user = await db.User.get(member.id);
      let introductions = guild.channels.cache.get(snowflakes.channels.introductions); // #introductions
      let modLogs = guild.channels.cache.get(snowflakes.channels.modRequests); // #mod-logs

      //Notify Mods that a new user is here
      let embed = u.embed()
        .setColor(0x7289da)
        .setDescription("Account Created:\n" + member.user.createdAt.toLocaleDateString())
        .setTimestamp()
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));


      let welcomeString;

      if (user) { // Member is returning

        let toAdd = user.roles.filter(role => (
          guild.roles.cache.has(role) &&
          !guild.roles.cache.get(role).managed &&
          //put any roles we *don't* want to prompt for here
          ![snowflakes.guilds.PrimaryServer].includes(role) &&
          !member.roles.cache.has(role)
        ));
        if (user.roles.length > 0)
          try {
            u.addRoles(member, toAdd);
          } catch (err) {
            u.log(err);
          }
        //give other bots time to add roles if they are going to do so.
        await delay(3000);
        let roleString = member.roles.cache.sort((a, b) => b.comparePositionTo(a)).map(role => role.name).join(", ");
        if (roleString.length > 1024) roleString = roleString.substr(0, roleString.indexOf(", ", 1000)) + " ...";

        embed.setTitle(member.displayName + " has rejoined the server.")
          .addFields([{ name: "Roles", value: roleString }]);
        welcomeString = `Welcome back, ${member}! Glad to see you again.`;

      } else { // Member is new
        const welcome = await generateWelcomeObject(member);
        welcomeString = `${welcome.Greeting} ${welcome.Prompt}\n\n${welcome.Directions}`.replaceAll("  ", " ");
        embed.setTitle(member.displayName + " has joined the server.");

        db.User.new(member);
      }

      if (!member.user.bot) {
        modLogs.send({ embeds: [embed] });
        introductions.send(welcomeStringCommandOverride({ content: welcomeString, allowedMentions: { users: [member.user.id] }, components: CakedayOptButtons }));

      }

    } catch (e) { u.errorHandler(e, "New Member Add"); }
  });


const Registrar = require("../utils/Utils.CommandRegistrar");
//Register commands
let commands = [
  new Registrar.SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Edits the server greeting.")
    .addSubcommand(
      new Registrar.SlashCommandSubcommandBuilder()
        .setName("embed")
        .setDescription("Appends and Embed to welcome messages until they are reset")
        .addStringOption(new Registrar.SlashCommandStringOption()
          .setName("title")
          .setDescription("The title of the embed")
          .setRequired(true)
        )
        .addStringOption(new Registrar.SlashCommandStringOption()
          .setName("image-url")
          .setDescription("The url of the image")
          .setRequired(true)
        )
        .addStringOption(new Registrar.SlashCommandStringOption()
          .setName("description")
          .setDescription("the description of the embed")
          .setRequired(true)
        )
    )
    .addSubcommand(
      new Registrar.SlashCommandSubcommandBuilder()
        .setName("override")
        .setDescription("Replaces the welcome message")
        .addStringOption(new Registrar.SlashCommandStringOption()
          .setName("text")
          .setDescription("The text to adjust welcome messages with")
          .setRequired(true)
        )

    )
    .addSubcommand(
      new Registrar.SlashCommandSubcommandBuilder()
        .setName("append")
        .setDescription("Adds text to the end of welcome messages")
        .addStringOption(new Registrar.SlashCommandStringOption()
          .setName("text")
          .setDescription("The text to adjust welcome messages with")
          .setRequired(true)
        )

    )
    .addSubcommand(
      new Registrar.SlashCommandSubcommandBuilder()
        .setName("prepend")
        .setDescription("Adds text to the end of welcome messages")
        .addStringOption(new Registrar.SlashCommandStringOption()
          .setName("text")
          .setDescription("The text to adjust welcome messages with")
          .setRequired(true)
        )

    )
    .addSubcommand(
      new Registrar.SlashCommandSubcommandBuilder()
        .setName("reset")
        .setDescription("Resets welcome messages to be the default")
    )
]
Module.addEvent("ready", async () => {
  let commandResponse = await Registrar.registerGuildCommands(Module, commands)
  console.log("Registered /welcome")
}).addInteractionCommand({
  name: "welcome",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    let member = interaction.member;
    let subCommand = interaction.options._subcommand;
    let subCommandOptions = interaction.options._hoistedOptions;
    let isAppropriateInteraction = interaction.type == "APPLICATION_COMMAND" && interaction.commandName == "welcome"
    let isAllowed = interaction.member.roles.cache.has(snowflakes.roles.Admin) || interaction.member.roles.cache.has(snowflakes.roles.Whisper) || interaction.member.roles.cache.has(snowflakes.roles.BotMaster)
    if (!isAllowed || !isAppropriateInteraction) return;
    else {

      let data = {
        welcomeString: "",
        type: "",
        embedTitle: "",
        embedImgUrl: "",
        validTypes: [
          "prepend",
          "embed",
          "append",
          "insert",
          "override",
          "disabled"
        ]
      }
      data.type = subCommand
      switch (subCommand) {
        case "append":
          data.welcomeString = subCommandOptions[0].value
          break;
        case "embed":
          data.welcomeString = subCommandOptions[2].value
          data.embedImgUrl = subCommandOptions[1].value
          data.embedTitle = subCommandOptions[0].value
          break;
        case "override":
          data.welcomeString = subCommandOptions[0].value
          break;
        case "prepend":
          data.welcomeString = subCommandOptions[0].value
          break;
        case "reset":
          data.type = "disabled"
          break;

        default: throw new Error("How did you even get here, this shouldn't be possible.");
          break;
      }
      fs.writeFileSync(`./data/welcome/welcomeOveride.json`, JSON.stringify(data, null, 4));
      let welcomeString = "You have successfully edited the welcome message. This is an example of the new welcome message."
      interaction.reply(welcomeStringCommandOverride({ content: welcomeString, allowedMentions: { users: [member.user.id] }, ephemeral: true }))

      console.log("welcome message modified");
    }
  }
});

module.exports = Module;
