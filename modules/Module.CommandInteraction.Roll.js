const Augur = require('augurbot')
const u = require('../utils/Utils.Generic')
const snowflakes = require('../config/snowflakes.json')
const { DiceRoll } = require('@dice-roller/rpg-dice-roller')
const Discord = require('discord.js')
const helpURL = 'https://dice-roller.github.io/documentation/guide/notation/'

/**
 * Trims a field to a specific length
 * @param {string} field
 * @param {number} maxLength
 * @returns the field trimmed to the specified length, with a ... on the end if the feild needed to be trimmed
 */
function trimField (field, maxLength) {
  const preparedField = field.toString().trim()
  if (preparedField.length > maxLength) {
    trimmedField = preparedField.slice(0, maxLength - 3) + '...'
  } else trimmedField = preparedField
  return trimmedField
}

// Functions to do with building the Dice Roll help UI
const diceEmbed = (titleModifier) => {
  const embed = u.embed({}, true)
    .setAuthor({ name: trimField('Dice Roll ' + (titleModifier || ''), 255), iconURL: 'https://www.freeiconspng.com/uploads/black-dice-d20-icon-15.png', url: helpURL })
    .setColor('#4682B4')
    .setURL(helpURL)
    .setFooter({ text: 'For more information and more advanced rolling options, see ' + helpURL })
  return embed
}

const exampleFormater = (example) => example[1] ? `\`\`\`${example[0]}: ${example[1]}\`\`\`` : `\n**${example[0]}**`

const rollHelpExampleString = () => {
  const validDiceRollExamples = [
    ['d6', 'Rolls a 6 sided dice'],
    ['4d10', 'Roll a 10 sided dice 4 times and add the results together'],
    ['4d%', 'Rolls a 100 sided dice 4 times'],
    ['d6+5', 'Rolls a 6 sided die and adds 5 to the result'],
    ['d6+5', 'Rolls a 6 sided die and adds 5 to the result'],
    ['2d8*5', 'Rolls and 8 sided die twice, adds them together, then multiplies the result by 5']
  ]

  const validDiceRollFormated = validDiceRollExamples.map(example => exampleFormater(example))
  const validDiceRollString = validDiceRollFormated.join('') + '\n'

  return "It seems that wasn't a valid dice roll notation. Examples of valid rolls are: \n\n" + validDiceRollString
}

const mathRollHelpExampleString = () => {
  const validMath = [

    ['Basic math such as addition, subtraction, multiplication, and division, are all valid:'],

    ['4d20+1', 'Rolls a 20 sided dice 4 times, and adds the results and 1 together.'],
    ['d10/2', 'Divides the result of a d10 by 2 and returns the result'],

    ['Some additional Math also works as you would normally expect it to:'],

    ['3d20^4', 'roll a 20 sided die 3 times and raise the result to the power of 4 (Exponent)'],
    ['2\*\*d4', 'Raises 2 to the power of the result of a 4 sided dice.'],
    ['3d4%2', 'Return the remainder of (3d4) divide by Y'],
    ['d20(3)', 'Equivalent to d20*3'],
    ['8(d6 + 2)', 'Adds the result of rolling a d6 and 2 together, then multiplies the previous result by 8'],

    ['The following JavaScript functions are also available for your use:']
  ]

  const validMathFormated = validMath.map(example => exampleFormater(example))
  const validMathString = validMathFormated.join('') + '\n'

  return validMathString + `\`${['abs', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'round', 'sign', 'sin', 'sqrt', 'tan'].join('()`, `')}()\``
}

const replyWithRollHelp = (interaction) => {
  const embed = diceEmbed('help')
    .setDescription(rollHelpExampleString())
    .addField('Math Options:', mathRollHelpExampleString())
  interaction.reply({
    embeds: [embed],
    ephemeral: true
  })
}
/**
 * Takes a discord interaction with the dice string option or "help", and returns a random result.
 * @param {Discord.Interaction} interaction
 * @param {boolean} [hiddenResponse = false] Set to true if you want the reaction to be ephemeral
 * @returns null
 */

const rollProcess = (interaction, hiddenResponse = false) => {
  {
    const diceString = interaction?.options?.get('dice')?.value
    if (!diceString || diceString == '' || diceString.toLowerCase() == 'help') {
      return replyWithRollHelp(interaction)
    } else {
      try {
        const diceRoll = new DiceRoll(diceString)
        diceRoll.notation
        let DiceResultString = ''
        let DiceResultStringPrefix = '```'
        const embed = diceEmbed(diceRoll.notation)
        switch (diceRoll.total) {
          case diceRoll.minTotal:
            DiceResultStringPrefix += 'diff\n- '
            embed.setColor('#FF0000')
            break
          case diceRoll.maxTotal:
            DiceResultStringPrefix += 'css\n'
            embed.setColor('#00FF00')
            break

          default:
            break
        }
        const DiceResultFormattingLength = 4096 - (DiceResultStringPrefix + 3)
        DiceResultString = DiceResultStringPrefix + trimField(diceRoll.total, DiceResultFormattingLength) + '```'

        embed.setDescription(DiceResultString)
        embed.setFooter({ text: trimField(`${diceRoll.output.replace(`${diceRoll.notation}:`, '')}`, 2048) })
        interaction.reply({
          embeds: [embed],
          ephemeral: hiddenResponse
        })
      } catch (error) {
        if (error.toString().indexOf('SyntaxError: Expected') > -1) {
          return replyWithRollHelp(interaction)
        } else if (error.toString().indexOf('RangeError: qty must be between 1 and 999') > -1) {
          return interaction.reply({ content: "I only have 999 dice sets. I can't roll more dice than that", ephemeral: true })
        } else throw error
      }
    }
  }
}

// Register commands

const Module = new Augur.Module()

// Run commands
Module.addInteractionCommand({
  name: 'roll',
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    rollProcess(interaction)
  }
}).addInteractionCommand({
  name: 'gmroll',
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    rollProcess(interaction, true)
  }
})

module.exports = Module
