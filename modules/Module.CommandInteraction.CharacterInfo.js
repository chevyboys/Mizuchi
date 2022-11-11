const Augur = require("augurbot"),
  gs = require("../utils/Utils.GetGoogleSheetsAsJson.js"),
  u = require("../utils/Utils.Generic.js"),
  { MessageActionRow, MessageButton, ButtonStyle } = require("discord.js");
const snowflakes = require('../config/snowflakes.json');

let characterInfo;

async function findCharacter(character) {
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

async function buildMessage(index) {

  let msg = "";
  let buttonRow = new MessageActionRow();
  let buttonEmpty = true;
  if (index != undefined) {
    const spoiler = new RegExp('\|\|');

    for (const [key, value] of Object.entries(characterInfo[index])) {
      if (value && key != "Character Name" && !key.startsWith("_") && !key.startsWith("*")) {
        const backticks = !spoiler.test(value) ? "```" : " ";
        msg += "__**" + key + "**__\n" + backticks + value + " " + backticks + "\n";
      }

      // ideally this should be in a different function buildButton but a bit of refactoring is required to not have two loops.
      if (value && key.startsWith("*")) {
        buttonEmpty = false;
        if (key != "*wikiUrl") {
          buttonRow.addComponents(
            new MessageButton()
              .setCustomId(key)
              .setLabel("Show " + key.split("*"))
              .setStyle("PRIMARY")
          );
        } else {
          buttonRow.addComponents(
            new MessageButton()
              .setLabel("Wiki")
              .setStyle("LINK")
              .setURL(value)
          );
        }

      }
    }
    if (buttonEmpty) {
      buttonRow.addComponents(
        new MessageButton()
          .setLabel("Edit Sheet")
          .setStyle("LINK")
          .setURL("https://docs.google.com/spreadsheets/d/1mOYLi95O9es2NDq0JTJ9xL5FVzDbwUvoahMrtdp0icg/")
      );
    }
  } else {
    buttonRow.addComponents(
      new MessageButton()
        .setLabel("Edit Sheet")
        .setStyle("LINK")
        .setURL("https://docs.google.com/spreadsheets/d/1mOYLi95O9es2NDq0JTJ9xL5FVzDbwUvoahMrtdp0icg/")
    );
    return { embeds: [u.embed().setTitle("Could not find character, feel free to add them yourself! \n If this message is a mistake contact Nora")], components: [buttonRow] };
  }

  const embed = u.embed().setAuthor({
    name: characterInfo[index]["Character Name"],
    url: characterInfo[index]["_wikiUrl"] || undefined,
    iconURL: characterInfo[index]["_imageUrl"] || undefined,
  }).setDescription(msg);
  if (characterInfo[index]["_Color Resolvable"])
    embed.setColor(characterInfo[index]["_Color Resolvable"]);

  return { embeds: [embed], components: [buttonRow] };
}

async function extraInfo(interaction) {
  const char = characterInfo.find(obj => {
    return obj["Character Name"] == interaction.message.embeds[0].author.name;
  })
  console.log(char[interaction.customId])



  // interaction.components.forEach(element => {
  //   element.set
  // });
  // interaction.deferReply(interaction);
  interaction.reply({ content: char[interaction.customId] });
}

const Module = new Augur.Module();
Module.setInit(async () => {
  characterInfo = await gs(snowflakes.sheets.characterInfo);
}).addInteractionCommand({
  name: "character-info",
  guildId: snowflakes.guilds.TestServer,
  hidden: false,
  process: async (interaction) => {
    await interaction.deferReply?.({ ephemeral: false });
    const character = interaction?.options?.get("character")?.value;

    const embed = await buildMessage(await findCharacter(character));
    // console.log(JSON.stringify(characterInfo));
    interaction.editReply(embed);
  }

}).addInteractionHandler({
  customId: `*Description`, process: extraInfo
}).addInteractionHandler({
  customId: `*Trivia`, process: extraInfo
})


module.exports = Module;