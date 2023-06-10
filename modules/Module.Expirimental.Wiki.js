const wiki = require("../utils/Utils.Wiki.js");
const Augur = require("augurbot");
const Module = new Augur.Module();
const snowflakes = require('../config/snowflakes.json');
const { distance, closest } = require('fastest-levenshtein');

const Command = {
  name: "wiki",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    let page = interaction?.options?.get("page")?.value
    let shorten = (!interaction?.options?.get("advanced")?.value);
    if (page.toLowerCase() != 'unknown page') {
      interaction.reply({ embeds: [await wiki.pageEmbed(page, shorten)] });
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
  if (!interaction.name == Command.name) return;
  const focusedValue = interaction.options.getFocused();

  let pages = wiki.allPages.sort((a, b) => levenshtein.get(a, focusedValue) - levenshtein.get(b, focusedValue));
  let numberOfPages = pages.length > 5 ? 5 : pages.length;
  await interaction.respond(
    pages.slice(0, numberOfPages).map(page => ({ name: page, value: page })),
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