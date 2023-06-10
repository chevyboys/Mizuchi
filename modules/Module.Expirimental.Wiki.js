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


function isValidChoice(choice, searchString) {
  //put your autocomplete filter to find choices here. a default is included here for reference
  return (choice.toLowerCase().indexOf(searchString.toLowerCase()) > -1);
}

const levenshteinTolerance = 2;
Module.addEvent("interactionCreate", async (interaction) => {
  if (!interaction.isAutocomplete() || interaction.commandName != Command.name) return;
  if (!interaction.name == Command.name) return;
  const focusedValue = interaction.options.getFocused();

  let pages = await wiki.allPages.sort((a, b) => {

    let aIncludes = a.toLowerCase().indexOf(focusedValue.toLowerCase()) > -1;
    let bIncludes = b.toLowerCase().indexOf(focusedValue.toLowerCase()) > -1;

    if (aIncludes && !bIncludes) {
      return -1; // 'a' contains focusedValue, prioritize it over 'b'
    } else if (!aIncludes && bIncludes) {
      return 1; // 'b' contains focusedValue, prioritize it over 'a'
    } else if (aIncludes && bIncludes) {
      return a.toLowerCase().indexOf(focusedValue.toLowerCase()) - b.toLowerCase().indexOf(focusedValue.toLowerCase())
    } else {
      const distanceA = distance(a, focusedValue);
      const distanceB = distance(b, focusedValue);
      let finalDistanceA;
      let finalDistanceB;
      if (focusedValue.length < a.length) {
        const distanceAAtLength = distance(a.slice(0, focusedValue.length).toLowerCase(), focusedValue.toLowerCase());
        finalDistanceA = distanceA > distanceAAtLength ? distanceAAtLength : distanceA;
      } else {
        finalDistanceA = distanceA;
      }


      if (focusedValue.length < b.length) {
        const distanceBAtLength = distance(b.slice(0, focusedValue.length).toLowerCase(), focusedValue.toLowerCase());
        finalDistanceB = distanceB > distanceBAtLength ? distanceBAtLength : distanceB;
      } else {
        finalDistanceB = distanceB;
      }

      return finalDistanceA - finalDistanceB; // Sort based on distance for other cases
    }
  });
  //find the last page before the page where distance is greater than 3



  let numberOfPages = pages.length > 5 ? 5 : pages.length;

  let tooFarAwayIndex = pages.slice(0, numberOfPages).findIndex(
    page =>
      page.toLowerCase().indexOf(focusedValue.toLowerCase()) == -1
      && distance(page.toLowerCase(), focusedValue.toLowerCase()) > levenshteinTolerance
      && distance(page.slice(0, focusedValue.length).toLowerCase(), focusedValue.toLowerCase()) > levenshteinTolerance);
  let finalNumberOfPages = tooFarAwayIndex > -1 ? tooFarAwayIndex : numberOfPages;



  if (pages.length == 0) return interaction.respond([{ name: "Unknown Page", value: "unknown page" }]);
  await interaction.respond(
    pages.slice(0, finalNumberOfPages).map(page => ({ name: page, value: page })),
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