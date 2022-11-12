const Augur = require("augurbot"),
  gs = require("../utils/Utils.GetGoogleSheetsAsJson.js"),
  u = require("../utils/Utils.Generic.js"),
  { MessageActionRow, MessageButton } = require("discord.js");
const snowflakes = require('../config/snowflakes.json');

// google sheet
let characterInfo;
//auto complete choices
let choices;

function isValidCharacter(character) {
  const re = new RegExp(character, 'i');
  let isValid = false;
  characterInfo.every(obj => {
    if (re.test(obj["Character Name"])) {
      isValid = true
      return false;
    }
    return true;
  });

  return isValid;
}

function findCharacter(character) {
  const re = new RegExp(character, 'i');
  let charKey;
  let index = 0;
  characterInfo.every(obj => {
    if (re.test(obj["Character Name"])) {
      charKey = obj["Character Name"];
      return false;
    }
    index++;
    return true;
  });

  return charKey ? index : undefined;
}

async function buildInteraction(index) {

  const linkButton = (label, link) => {
    return new MessageButton()
      .setLabel(label)
      .setStyle("LINK")
      .setURL(link);
  }
  const sheetButton = linkButton("Edit Sheet", "https://docs.google.com/spreadsheets/d/1mOYLi95O9es2NDq0JTJ9xL5FVzDbwUvoahMrtdp0icg/");

  let buttonRow = new MessageActionRow();
  let embed;
  if (index != undefined) {
    let msg = "";
    for (const [key, value] of Object.entries(characterInfo[index])) {
      const button = await buildButton(key, value);
      if (button != undefined)
        buttonRow.addComponents(button);

      msg += await buildEmbed(key, value);
    }

    console.log(buttonRow.components)

    if (buttonRow.components.length == 0)
      buttonRow.addComponents(sheetButton);

    embed = u.embed().setAuthor({
      name: characterInfo[index]["Character Name"],
      url: characterInfo[index]["_wikiUrl"] || undefined,
      iconURL: characterInfo[index]["_imageUrl"] || undefined,
    }).setDescription(msg);
    if (characterInfo[index]["_Color Resolvable"])
      embed.setColor(characterInfo[index]["_Color Resolvable"]);

  } else {
    buttonRow.addComponents(sheetButton);
    embed = u.embed().setTitle("Could not find character, feel free to add them yourself! \n If this message is a mistake contact Nora");
  }

  return { embeds: [embed], components: [buttonRow] };
}

async function buildEmbed(key, value) {
  let msg = "";
  const spoiler = /\|\|/;
  if (value && key != "Character Name" && !key.startsWith("_") && !key.startsWith("*")) {
    const backticks = !spoiler.test(value) ? "```" : "   ";
    const newLines = backticks == "```" ? "\n" : "\n\n";
    msg += "**" + key + "**\n" + backticks + value + " " + backticks + newLines;
  }
  return msg;
}

async function buildButton(key, value) {
  let button;
  if (value && key.startsWith("*")) {
    if (key != "*wikiUrl") {
      button = new MessageButton()
        .setCustomId(key)
        .setLabel("Show " + key.slice(1))
        .setStyle("PRIMARY");
    } else {
      button = new MessageButton()
        .setLabel("Wiki")
        .setStyle("LINK")
        .setURL(value)
    }
  }
  return button;
}

async function extraInfo(interaction) {
  try {

    let button = interaction.message.components[0].components.find(obj => {
      return obj.customId == interaction.customId;
    });
    if (button.style != "LINK")
      button.disabled = true;

    const char = characterInfo.find(obj => {
      return obj["Character Name"] == interaction.message.embeds[0].author.name;
    })

    interaction.message.edit({ components: interaction.message.components })
    interaction.reply({ content: char[interaction.customId] });
  } catch (error) { u.errorHandler(error, "CharacterInfo extra info button interaction") }
}

async function updateCharacterInfo() {
  characterInfo = await gs(snowflakes.sheets.characterInfo);
  choices = characterInfo.map(obj => {
    return obj["Character Name"].toLowerCase();
  });
}

const Module = new Augur.Module();
Module.setInit(async () => {
  updateCharacterInfo();
}).addInteractionCommand({
  name: "character-info",
  guildId: snowflakes.guilds.TestServer,
  hidden: false,
  process: async (interaction) => {
    try {
      await interaction.deferReply?.({ ephemeral: false });
      const character = interaction?.options?.get("character")?.value;

      const embed = await buildInteraction(await findCharacter(character));
      // console.log(JSON.stringify(characterInfo));
      interaction.editReply(embed);
    } catch (error) { u.errorHandler(error, "CharacterInfo character-info slash command") }
  }

}).addEvent('interactionCreate', async (interaction) => {
  console.log('triggered');
  if (!interaction.isAutocomplete() || interaction.commandName != "character-info") return;
  const focusedValue = interaction.options.getFocused();
  const filtered = choices.filter((choice) => {
    const re = new RegExp(focusedValue, 'i');
    return re.test(choice);
  });

  await interaction.respond(
    filtered.map(choice => ({ name: choice, value: choice })),
  );

}).addInteractionHandler({
  customId: `*Description`, process: extraInfo
}).addInteractionHandler({
  customId: `*Trivia`, process: extraInfo
}).setClockwork(
  () => {
    try {
      return setInterval(updateCharacterInfo, 1000 * 60 * 60);
    } catch (error) { u.errorHandler(error, "CharacterInfo Clockwork"); }
  }
)


module.exports = Module;