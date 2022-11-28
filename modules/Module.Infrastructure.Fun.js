const Augur = require("augurbot"),
  snowflakes = require('../config/snowflakes.json'),
  Discord = require("discord.js"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic")

async function shhh(msg) {
  try {
    if (!snowflakes.channels.secret) return;
    let content = msg.content.toLowerCase().replaceAll(" ", "").replaceAll("-", "").replaceAll("_", "")
    let channelName = msg.guild.channels.cache.get(snowflakes.channels.secret).name.toLowerCase().replaceAll(" ", "").replaceAll("-", "").replaceAll("_", "")
    if (content?.indexOf(snowflakes.channels.secret) > -1 || content?.indexOf(channelName) > -1) {
      await msg.react("🤫");
      await u.wait(5000)
      await msg.reactions.resolve("🤫").users.remove(msg.client.user.id);
    }
  } catch (error) {
    u.noop();
  }

}
/**
 * this is either null or a date object
 */
let lastDone;
/**
 * determines if the bot should respond with good morning, good afternoon, or good night
 * @param {Discord.Message} msg 
 */
function goodTime(msg) {
  const cooldownSeconds = 90;

  let content = msg?.content?.toLowerCase();
  let spacelessContent = content.replaceAll(" ", "")
  if (content.indexOf("g") > -1) {
    let replyMessage;
    if (content.indexOf(" gn") > -1 || content.startsWith("gn") || spacelessContent.indexOf("goodnight") > -1) {
      replyMessage = "Good night";
      if (spacelessContent.indexOf("gnclimbers") > -1 || spacelessContent.indexOf("goodnightclimbers") > -1 || spacelessContent.indexOf("gntavare") > -1 || spacelessContent.indexOf("goodnighttavare") > -1) {
        replyMessage += " " + msg.member.displayName;
      }
      replyMessage += "!"
    }
    else if (content.startsWith("gm ") || spacelessContent.indexOf("goodmorning") > -1) {
      replyMessage = "Good morning";
      if (spacelessContent.indexOf("gmclimbers") > -1 || spacelessContent.indexOf("goodmorningclimbers") > -1 || spacelessContent.indexOf("gmtavare") > -1 || spacelessContent.indexOf("goodmorningtavare") > -1) {
        replyMessage += " " + msg.member.displayName;
      }
      replyMessage += "!";
    }
    if (replyMessage) {
      if (replyMessage.indexOf(msg.member.displayName) > -1) {
        lastDone = new Date();
        msg.channel.send(replyMessage);
      }
      else if (lastDone && lastDone.valueOf() > new Date().valueOf() - 1000 * cooldownSeconds) {
        return;
      } else {
        lastDone = new Date();
        msg.channel.send(replyMessage);
      }
    }
  }

}

function youreWelcome(msg) {
  if (msg.content.toLowerCase().replaceAll(" ", "").indexOf("thankyoutavare") {
    msg.reply("You're very welcome!")
  }
}

const emojis = new Discord.Collection([
  [snowflakes.roles.BotMaster, snowflakes.emoji.bot],    // BotMasters - botIcon
  ["197050381270777857", snowflakes.emoji.upDawn], // Kritta - updawn
]);

async function tavareSawThatPing(msg) {

  emojis.set(msg.client.user.id, "👋");
  // privilagedPingPerson Pings
  for (const [privilagedPingPerson, emoji] of emojis)
    if (msg.mentions.members.has(privilagedPingPerson) || msg.mentions.roles.has(privilagedPingPerson) || msg.mentions.members.some(m => m.roles.cache.has(privilagedPingPerson))) msg.react(emoji).catch(u.noop);

}



Module.addEvent("messageCreate", async (msg) => {
  if (msg.author.bot || (!msg.guild || msg.guild.id != snowflakes.guilds.PrimaryServer)) {
    return;
  }
  youreWelcome(msg)
  goodTime(msg);
  shhh(msg);
  tavareSawThatPing(msg);
});
module.exports = Module;