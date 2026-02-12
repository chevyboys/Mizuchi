const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json');
const { DiceRoll } = require('@dice-roller/rpg-dice-roller');
const Discord = require("discord.js");
const { get } = require("selenium-webdriver/http");
let helpURL = "https://dice-roller.github.io/documentation/guide/notation/";
const { SlashCommandBuilder } = require('@discordjs/builders');


const gs = require("../utils/Utils.GetGoogleSheetsAsJson.js");
let rollData = {};
//load roll data from google sheets
(async () => {
  try {
    //for a test, write the roll data to a json file
    rollData = await gs(snowflakes.sheets.rolls, true);

  } catch (error) {
    u.errorHandler(error, "Error loading roll data from Google Sheets");
  }
})();

//lowercase all the keys in rollData and replace any spaces with underscores
// rollData = Object.fromEntries(
//   Object.entries(rollData).map((value, key) => [key.toLowerCase().replace(/ /g, "_"), value])
// );
// 
// Object.entries(rollData).forEach(async ([key, value]) => {
//   await u.errorHandler(`Loaded ${value.length} entries for roll data key: ${key}`);
// });
// 
// const fs = require("fs");
// fs.writeFileSync("./data/rollData.json", JSON.stringify(rollData, null, 2));



/**
 * Trims a field to a specific length
 * @param {string} field 
 * @param {number} maxLength 
 * @returns the field trimmed to the specified length, with a ... on the end if the field needed to be trimmed
 */
function trimField(field, maxLength) {
  let preparedField = field.toString().trim()
  if (preparedField.length > maxLength) {
    trimmedField = preparedField.slice(0, maxLength - 3) + "..."
  } else trimmedField = preparedField;
  return trimmedField;
}

/* Example csv data for dominions from Google Sheets
prime dominion,air,light,motion,water,life,mental,earth,shadow,enhancement,flame,death,perception,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
deep dominion,Acuity,Adaptation,Alteration,Banishment,Blight,Blood,Bone,Breath,Chaos,Clarity,Coercion,Communication,Constellations,Dawn,Density,Destiny,Dreams,Enervation,Heat,Ice,Incineration,Lies,Lightning,Madness,Memory,Metal,Peace,Poison,Protection,Purity,Rain,Ruin,Sand,Secrets,Shade,Sight,Sound,Spirit,Supremacy,Tides,Time,Tranquility,Transcendence,Travel,Vitality,Void,War,Wood,,,,,,,,,,,,
dominion,air,light,motion,water,life,mental,earth,shadow,enhancement,flame,death,perception,Acuity,Adaptation,Alteration,Banishment,Blight,Blood,Bone,Breath,Chaos,Clarity,Coercion,Communication,Constellations,Dawn,Density,Destiny,Dreams,Enervation,Heat,Ice,Incineration,Lies,Lightning,Madness,Memory,Metal,Peace,Poison,Protection,Purity,Rain,Ruin,Sand,Secrets,Shade,Sight,Sound,Spirit,Supremacy,Tides,Time,Tranquility,Transcendence,Travel,Vitality,Void,War,Wood
air deep,Communication,Breath,Rain,Lightning,Blight,Sound,Vitality,Travel,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
light deep,Destiny,Spirit,Peace,Purity,Banishment,Sight,Constellations,Vitality,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
motion deep,Acuity,Adaptation,Tides,Heat,Chaos,Time,Constellations,Travel,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
transference deep,Acuity,Adaptation,Tides,Heat,Chaos,Time,Constellations,Travel,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
water deep,Tides,Peace,Rain,Sand,Poison,Ice,Clarity,Blood,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
life deep,Adaptation,Spirit,Breath,Wood,Shade,Protection,Transcendence,Blood,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
knowledge deep,Acuity,Destiny,Communication,Tranquility,Secrets,Memory,Transcendence,Clarity,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
mental deep,Acuity,Destiny,Communication,Tranquility,Secrets,Memory,Transcendence,Clarity,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
earth deep,Tranquility,Wood,Sand,Metal,Bone,Alteration,Density,Enervation,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
umbral deep,Secrets,Shade,Poison,War,Supremacy,Dreams,Void,Enervation,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
shadow deep,Secrets,Shade,Poison,War,Supremacy,Dreams,Void,Enervation,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
stability deep,Memory,Protection,Ice,Dawn,Ruin,Coercion,Void,Density,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
enhancement deep,Memory,Protection,Ice,Dawn,Ruin,Coercion,Void,Density,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
fire deep,Heat,Purity,Lightning,Metal,War,Dawn,Incineration,Lies,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
death deep,Chaos,Banishment,Blight,Bone,Supremacy,Ruin,Incineration,Madness,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
perception deep,Time,Sight,Sound,Alteration,Dreams,Coercion,Lies,Madness,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
deception deep,Time,Sight,Sound,Alteration,Dreams,Coercion,Lies,Madness,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
spire,Spider,Serpent,Hydra,Tortoise,Phoenix,Tiger,Dragon,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
continent,Kaldwyn,Mythralis,Dania,Vylin Tor,Tyrennia,Vashen,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
attunement,Assassin,Commander,Executioner,Juggernaut,Legionnaire,Saboteur,Scourge,Shieldbreaker,Conjurer,Mesmer,Dancer,Purifier,Pyromancer,Shapshifter,Spellsinger,Swordmaster,Diviner,Elementalist,Mender,Gaurdian,Enchanter,Summoner,Shaper,Shadow,Analyst,Architect,Biomancer,Controller,Forgemaster,Illuminator,Sentinel,Transmuter,Acolyte,Champion,Cloudcaller,Illusionist,Seer,Soulblade,Wavewalker,Wayfarer,,,,,,,,,,,,,,,,,,,,
Attunement Spider,Paladin,Arbiter,Hierophant,Chronomancer,Necromancer,Soverign,Whisper,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Attunement Serpent,Diviner,Elementalist,Mender,Gaurdian,Enchanter,Summoner,Shaper,Shadow,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Attunement Hydra,Assassin,Commander,Executioner,Juggernaut,Legionnaire,Saboteur,Scourge,Shieldbreaker,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Attunement Tortise,Acolyte,Champion,Cloudcaller,Illusionist,Seer,Soulblade,Wavewalker,Wayfarer,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Attunement Pheonix,Conjurer,Mesmer,Dancer,Purifier,Pyromancer,Shapshifter,Spellsinger,Swordmaster,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Attunement Tiger,Analyst,Architect,Biomancer,Controller,Forgemaster,Illuminator,Sentinel,Transmuter,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Attunement Dragon,[Redacted],,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
*/



//Functions to do with building the Dice Roll help UI
let diceEmbed = (titleModifier) => {
  let embed = u.embed({}, true)
    .setAuthor({ name: trimField("Dice Roll " + (titleModifier || ""), 255), iconURL: "https://www.freeiconspng.com/uploads/black-dice-d20-icon-15.png", url: helpURL })
    .setColor("#4682B4")
    .setURL(helpURL)
    .setFooter({ text: "For more information and more advanced rolling options, see " + helpURL })
  return embed;
}

let exampleFormatter = (example) => example[1] ? `\`\`\`${example[0]}: ${example[1]}\`\`\`` : `\n**${example[0]}**`;

let rollHelpExampleString = () => {
  let validDiceRollExamples = [
    ["d6", "Rolls a 6 sided dice"],
    ["4d10", "Roll a 10 sided dice 4 times and add the results together"],
    ["4d%", "Rolls a 100 sided dice 4 times"],
    ["d6+5", "Rolls a 6 sided die and adds 5 to the result"],
    ["d6+5", "Rolls a 6 sided die and adds 5 to the result"],
    ["2d8*5", "Rolls and 8 sided die twice, adds them together, then multiplies the result by 5"],
  ]

  let validDiceRollFormatted = validDiceRollExamples.map(example => exampleFormatter(example))
  let validDiceRollString = validDiceRollFormatted.join("") + "\n"

  return "It seems that wasn't a valid dice roll notation. Examples of valid rolls are: \n\n" + validDiceRollString
}


let mathRollHelpExampleString = () => {
  let validMath = [

    ["Basic math such as addition, subtraction, multiplication, and division, are all valid:"],

    ["4d20+1", "Rolls a 20 sided dice 4 times, and adds the results and 1 together."],
    ["d10/2", "Divides the result of a d10 by 2 and returns the result"],


    ["Some additional Math also works as you would normally expect it to:"],

    ["3d20^4", "roll a 20 sided die 3 times and raise the result to the power of 4 (Exponent)"],
    ["2\*\*d4", "Raises 2 to the power of the result of a 4 sided dice."],
    ["3d4%2", "Return the remainder of (3d4) divide by Y"],
    ["d20(3)", "Equivalent to d20*3"],
    ["8(d6 + 2)", "Adds the result of rolling a d6 and 2 together, then multiplies the previous result by 8"],

    ["The following JavaScript functions are also available for your use:"],
  ]

  let validMathFormatted = validMath.map(example => exampleFormatter(example))
  let validMathString = validMathFormatted.join("") + "\n"

  return validMathString + `\`${["abs", "ceil", "cos", "exp", "floor", "log", "max", "min", "pow", "round", "sign", "sin", "sqrt", "tan"].join("()`, `")}()\``
}

let replyWithRollHelp = (interaction) => {
  let embed = diceEmbed("help")
    .setDescription(rollHelpExampleString())
    .addField("Math Options:", mathRollHelpExampleString())
  interaction.reply({
    embeds: [embed],
    ephemeral: true
  })

}


function getRandomDominion(type, interaction) {

  const DOMINIONS = {
    prime: [
      "Air",
      "light",
      "motion",

      "water",
      "life",
      "knowledge",

      "earth",
      "shadow",
      "stability",

      "fire",
      "death",
      "perception",
    ],
    deep: [
      "Acuity",
      "Adaptation",
      "Alteration",
      "Banishment",
      "Blight",
      "Blood",
      "Bone",
      "Breath",
      "Chaos",
      "Clarity",
      "Coercion",
      "Communication",
      "Constellations",
      "Dawn",
      "Density",
      "Destiny",
      "Dreams",
      "Enervation",
      "Heat",
      "Ice",
      "Incineration",
      "Lies",
      "Lightning",
      "Madness",
      "Memory",
      "Metal",
      "Peace",
      "Poison",
      "Protection",
      "Purity",
      "Rain",
      "Ruin",
      "Sand",
      "Secrets",
      "Shade",
      "Sight",
      "Sound",
      "Spirit",
      "Supremacy",
      "Tides",
      "Time",
      "Tranquility",
      "Transcendence",
      "Travel",
      "Vitality",
      "Void",
      "War",
      "Wood",
    ],
    all: [
      "Acuity",
      "Adaptation",
      "Alteration",
      "Banishment",
      "Blight",
      "Blood",
      "Bone",
      "Breath",
      "Chaos",
      "Clarity",
      "Coercion",
      "Communication",
      "Constellations",
      "Dawn",
      "Density",
      "Destiny",
      "Dreams",
      "Enervation",
      "Heat",
      "Ice",
      "Incineration",
      "Lies",
      "Lightning",
      "Madness",
      "Memory",
      "Metal",
      "Peace",
      "Poison",
      "Protection",
      "Purity",
      "Rain",
      "Ruin",
      "Sand",
      "Secrets",
      "Shade",
      "Sight",
      "Sound",
      "Spirit",
      "Supremacy",
      "Tides",
      "Time",
      "Tranquility",
      "Transcendence",
      "Travel",
      "Vitality",
      "Void",
      "War",
      "Wood",

      "Air",
      "light",
      "motion",

      "water",
      "life",
      "knowledge",

      "earth",
      "shadow",
      "stability",

      "fire",
      "death",
      "perception",
    ]
  }
  let returnedValue = "";
  let title = "";
  switch (type) {
    case "dominion": //get a random dominion
      //get a random dominion from dominions.all
      returnedValue = DOMINIONS.all[Math.floor(Math.random() * DOMINIONS.all.length)];
      title = "Random Dominion";
      break;
    case "prime": //get a random dominion from dominions.prime
      returnedValue = DOMINIONS.prime[Math.floor(Math.random() * DOMINIONS.prime.length)];
      title = "Random Prime Dominion";
      break;
    case "deep": //get a random dominion from dominions.deep
      returnedValue = DOMINIONS.deep[Math.floor(Math.random() * DOMINIONS.deep.length)];
      title = "Random Deep Dominion";
      break;
  }
  //replace the first letter with a capital letter
  returnedValue = returnedValue.replace(returnedValue[0], returnedValue[0].toUpperCase());
  let embed = u.embed().setDescription("The Dominion of " + returnedValue).setTitle(title || "Random Dominion")
  return interaction.reply({ embeds: [embed] });
}

/**
 * Takes a discord interaction with the dice string option or "help", and returns a random result.
 * @param {Discord.Interaction} interaction 
 * @param {boolean} [hiddenResponse = false] Set to true if you want the reaction to be ephemeral
 * @returns null
 */

let rollProcess = (interaction, hiddenResponse = false) => {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "dice") {
    let diceString = interaction?.options?.get("dice")?.value;
    if (!diceString || diceString == "" || diceString.toLowerCase() == "help") {
      return replyWithRollHelp(interaction)

    } else {
      if (diceString.toLowerCase().indexOf("prime") > -1) {
        getRandomDominion("prime", interaction);
      } else if (diceString.toLowerCase().indexOf("deep") > -1) {
        getRandomDominion("deep", interaction);
      } else if (diceString.toLowerCase().indexOf("dominion") > -1) {
        getRandomDominion("dominion", interaction);
      } else {
        try {
          let diceRoll = new DiceRoll(diceString)
          diceRoll.notation
          let DiceResultString = "";
          let DiceResultStringPrefix = "```"
          let embed = diceEmbed(diceRoll.notation)
          switch (diceRoll.total) {
            case diceRoll.minTotal:
              embed.setColor("#FF0000")
              break;
            case diceRoll.maxTotal:
              embed.setColor("#00FF00")
              break;
            default:
              break;
          }
          let DiceResultFormattingLength = 4096 - (DiceResultStringPrefix + 3)
          DiceResultString = DiceResultStringPrefix + trimField(diceRoll.total, DiceResultFormattingLength) + "```";

          embed.setDescription(DiceResultString)
          embed.setFooter({ text: trimField(`${diceRoll.output.replace(`${diceRoll.notation}:`, "")}`, 2048) })
          interaction.reply({
            embeds: [embed],
            ephemeral: hiddenResponse
          })


        } catch (error) {
          if (error.toString().indexOf("SyntaxError: Expected") > -1) {
            return replyWithRollHelp(interaction)
          } else if (error.toString().indexOf("RangeError: qty must be between 1 and 999") > -1) {
            return interaction.reply({ content: "I only have 999 dice sets. I can't roll more dice than that", ephemeral: true })
          }
          else throw error;
        }
      }
    }
  }
  if (subcommand == "help") {
    return replyWithRollHelp(interaction)
  }
  //if the sub command is a key in rollData, get a random entry from that key
  if (rollData[subcommand]) {
    let entries = rollData[subcommand];
    let randomEntry = entries[Math.floor(Math.random() * entries.length)];
    let embed = u.embed()
      .setTitle(`Random ${subcommand}`)
      .setDescription(randomEntry);
    return interaction.reply({ embeds: [embed] });
  }
}


const Module = new Augur.Module();
Module
  .addInteractionCommand({
    name: "roll",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      rollProcess(interaction);
    }

  });
module.exports = Module;