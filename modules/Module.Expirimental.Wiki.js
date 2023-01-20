const wiki = require("../utils/Utils.Wiki.js");
const Augur = require("augurbot");
const Module = new Augur.Module();
const snowflakes = require('../config/snowflakes.json');

const Command = {
  name: "wiki",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    let page = interaction?.options?.get("reason")?.value
    if (page.toLowerCase() != 'unknown page') {
      interaction.reply({ embeds: [wiki.pageEmbed(page)] });
    }
    else interaction.reply({ content: "I couldn't find that page" });
  }
}


function isValidChoice(choice, searchString) {
  //put your autocomplete filter to find choices here. a default is included here for reference
  return (choice.toLowerCase().indexOf(searchString.toLowerCase()) > -1);
}

Module.addEvent("interactionCreate", async (interaction) => {
  if (!interaction.isAutocomplete() || interaction.commandName != Command.name) return;
  const focusedValue = interaction.options.getFocused();
  const choices = await wiki.search(focusedValue);
  const filtered = choices.filter(choice => isValidChoice(choice, focusedValue));
  if (choices.length < 1) {
    await interaction.respond([{ name: 'unknown page', value: 'unknown page' }])
  }
  else await interaction.respond(
    filtered.map(choice => ({ name: choice, value: choice })),
  );

}).addInteractionCommand(Command)
module.exports = Module;

/*
 * to register this command, add this to the register.js file
 
 */

/*Module.addCommand({
  name: "wiki",
  description: "finds a wiki page",
  category: "Expirimental",
  process: async (msg, suffix) => {
    try {
      let search = await wiki.search(suffix.trim())
      let embed = await wiki.pageEmbed(search)
      if (search.length > 0) msg.reply({ embeds: [embed] })
    } catch (error) {
      msg.reply("I couldn't find that wiki page")
    }
  }
}).addCommand({
  name: "description",
  description: "finds a wiki page description",
  category: "Expirimental",
  aliases: ['whatis'],
  process: async (msg, suffix) => {
    try {
      let search = await wiki.search(suffix.trim())
      let embed = await wiki.pageEmbed(search, true)
      if (search.length > 0) msg.reply({ embeds: [embed] })
    } catch (error) {
      msg.reply("I couldn't find that wiki page")
    }
  }
})*/


module.exports = Module;