const Augur = require("augurbot"),
  snowflakes = require('../config/snowflakes.json'),
  Discord = require("discord.js"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic")

async function shhh(msg) {
  if (!snowflakes.channels.secret) return;
  let content = msg.content.toLowerCase().replaceAll(" ", "").replaceAll("-", "").replaceAll("_", "")
  let channelName = msg.guild.channels.cache.get(snowflakes.channels.secret).name.toLowerCase().replaceAll(" ", "").replaceAll("-", "").replaceAll("_", "")
  if (content?.indexOf(snowflakes.channels.secret) > -1 || content?.indexOf(channelName) > -1) {
    await msg.react("🤫");
    await u.wait(5000)
    await msg.reactions.resolve("🤫").users.remove(msg.client.user.id);
  }
}


const emojis = new Discord.Collection([
  [snowflakes.roles.BotMaster, snowflakes.emoji.bot],    // BotMasters - botIcon
  ["197050381270777857", snowflakes.emoji.upDawn], // Kritta - updawn

]);

async function tavareSawThatPing(msg) {
  if (!msg.author.bot && msg.guild && msg.guild.id == snowflakes.guilds.PrimaryServer) {
    emojis.set(msg.client.user.id, "👋");
    // privilagedPingPerson Pings
    for (const [privilagedPingPerson, emoji] of emojis)
      if (msg.mentions.members.has(privilagedPingPerson) || msg.mentions.roles.has(privilagedPingPerson) || msg.mentions.members.some(m => m.roles.cache.has(privilagedPingPerson))) msg.react(emoji).catch(u.noop);


  }
}



Module.addEvent("messageCreate", async (msg) => {
  shhh(msg);
  tavareSawThatPing(msg);
});
module.exports = Module;