const wiki = require("../utils/Utils.Wiki.js");
const Augur = require("augurbot");
const Module = new Augur.Module();


Module.addCommand({
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
})


module.exports = Module;