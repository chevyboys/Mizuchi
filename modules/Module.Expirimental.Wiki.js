const wiki = require("../utils/Utils.Wiki.js");
const Augur = require("augurbot");
const Module = new Augur.Module();
const snowflakes = require('../config/snowflakes.json');
const u = require('../utils/Utils.Generic');

const Command = {
  name: "wiki",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    let page = interaction?.options?.get("page")?.value
    let shorten = (!interaction?.options?.get("advanced")?.value);
    try {
      if (page.toLowerCase() != 'unknown page') {
        interaction.reply({ embeds: [await wiki.pageEmbed(page, shorten)] });
      }
      else interaction.reply({ content: "I couldn't find that page", ephemeral: true });
    } catch (error) {
      console.log(error);
      interaction.reply({ content: "I couldn't find that page", ephemeral: true });
    }
  }
}


Module.addEvent("interactionCreate", async (interaction) => {
  if (!interaction.isAutocomplete() || interaction.commandName != Command.name) return;
  if (!interaction.name == Command.name) return;
  const focusedValue = interaction.options.getFocused();
  let pages = u.smartSearchSort(await wiki.allPages, focusedValue)
  if (pages.length == 0) return interaction.respond([{ name: "Unknown Page", value: "unknown page" }]);
  await interaction.respond(
    pages.map(page => ({ name: page, value: page }))
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
