const Augur = require("augurbot"),
  gs = require("../utils/Utils.GetGoogleSheetsAsJson.js"),
  u = require("../utils/Utils.Generic.js"),
  fs = require("fs");
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

  let out = "";
  if (index != undefined) {
    const spoiler = new RegExp('\|\|');

    for (const [key, value] of Object.entries(characterInfo[index])) {
      if (value && key != "Character Name" && !key.startsWith("_")) {
        const backticks = !spoiler.test(value) ? "```" : " ";
        out += "__**" + key + "**__\n" + backticks + value + " " + backticks + "\n";
      }
    }
  } else {
    return u.embed().setTitle("Could not find character");
  }

  const embed = u.embed().setAuthor({
    name: characterInfo[index]["Character Name"],
    url: characterInfo[index]["_wikiUrl"] || undefined,
    iconURL: characterInfo[index]["_imageUrl"] || undefined,
  }).setDescription(out);
  if (characterInfo[index]["_Color Resolvable"])
    embed.setColor(characterInfo[index]["_Color Resolvable"]);
  return embed;
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
    interaction.editReply({ embeds: [embed] });
  }

})

module.exports = Module;