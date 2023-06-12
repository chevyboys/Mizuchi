const Augur = require("augurbot"),
  snowflakes = require('../config/snowflakes.json'),
  Discord = require("discord.js"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic");
const RoleClient = require("../utils/Utils.RolesLogin");
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
const { distance, closest } = require('fastest-levenshtein');

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
 * determines if the bot should respond with good morning, good afternoon, or good night, then does so
 * @param {Discord.Message} msg 
 */
function goodTime(msg) {
  const cooldownSeconds = 90;
  if (msg.channel != snowflakes.channels.general) return;
  let content = msg?.content?.toLowerCase();
  let spacelessContent = content.replaceAll(" ", "")
  if (content.indexOf("g") > -1) {
    let replyMessage;
    if (content.indexOf(" gn") > -1 || content.startsWith("gn") || spacelessContent.indexOf("goodnight") > -1 || content == "night") {
      replyMessage = "Radience wishes you a good night";
      if (spacelessContent.indexOf("gnclimbers") > -1 || spacelessContent.indexOf("nightclimbers") > -1 || spacelessContent.indexOf("gntavare") > -1 || spacelessContent.indexOf("nighttavare") > -1) {
        replyMessage += " " + msg.member.displayName;
      }
      replyMessage += "!"
    }
    else if (content.startsWith("gm ") || spacelessContent.indexOf("goodmorning") > -1 || content == "morning") {
      replyMessage = "Radience wishes you a good morning";
      if (spacelessContent.indexOf("gmclimbers") > -1 || spacelessContent.indexOf("morningclimbers") > -1 || spacelessContent.indexOf("gmtavare") > -1 || spacelessContent.indexOf("morningtavare") > -1) {
        replyMessage += " " + msg.member.displayName;
      }
      replyMessage += "!";
    }
    if (replyMessage) {
      if (replyMessage.indexOf(msg.member.displayName) > -1) {
        lastDone = new Date();
        msg.channel.send(replyMessage);
      }
      else if (getRandomInt(10) < 9 || lastDone && lastDone.valueOf() > new Date().valueOf() - 1000 * cooldownSeconds) {
        return;
      } else {
        lastDone = new Date();
        msg.channel.send(replyMessage);
      }
    }
  }

}

let roleGuild;
let prideRepliedUsers = [];
/**determines if the bot should respond with Happy pride, then does so 
 * @param {Discord.Message} msg
*/
async function pride(msg) {
  if (msg.author.bot || prideRepliedUsers.includes(msg.author.id)) return;
  if (msg.channel != snowflakes.channels.general) return;
  let mon = new Date().getMonth();
  if (mon != 5) return
  let content = msg?.content?.toLowerCase();
  let spacelessContent = content.replaceAll(" ", "");
  if (mon != 5) return
  if (!roleGuild) {
    roleGuild = await RoleClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
  }
  let enabled = false;
  if (spacelessContent.indexOf("happypride") > -1 || spacelessContent.indexOf("pridetavare") > -1 || (msg.mentions.members.has(msg.client.user.id) && spacelessContent.indexOf("pride"))) enabled = true;
  else {
    let split = content.split(" ");
    for (let i = 1; i < split.length; i++) {
      try {
        let word = split[i - 1] + split[i];
        if (distance(word, "happypride") < 2 || distance(word, "pridetavare") < 2 || (msg.mentions.members.has(msg.client.user.id) && distance(word, "pride") < 2)) {
          enabled = true;
          break;
        }
      } catch (error) {
        u.noop();
      }
    }
  }
  if (enabled) {
    let addons = [
      "🏳‍🌈",
      "It's dangerous to go alone, take this 🏳‍🌈",
      "🏳‍🌈🏳‍🌈🏳‍🌈",
      "🏳‍🌈🏳‍🌈🏳‍🌈🏳‍🌈",
      "Take this 🏳‍🌈 and slay with pride!",
      "Grab this 🏳‍🌈 and let your true colors shine!",
      "Here's a 🏳‍🌈 for your courageous journey!",
      "Take this 🏳‍🌈 and slay with pride!",
      "Wield this 🏳‍🌈 and conquer hate with love!",
      "Grab this 🏳‍🌈 and let your true colors shine!",
      "Have a 🏳‍🌈!",
      "Here's a 🏳‍🌈 for wherever your exploration of yourself takes you!",
      "You are fabulous! ",
      "You deserve love and acceptance.",
      "Radiance appreciates your presence here.",
      "Go drink some water, you deserve it.",
      "Radiance reminds you that you are valid, and we care about you.",
      "Remember to take care of yourself this month.",
      "You are excellent, and we are glad you are here.",
      "Thanks for being here.",
      "Radiance is proud of you.",
      "In this vast world, embrace this 🏳‍🌈 and let it be a reminder of the strength that lies within you.",
      "Sometimes, the greatest battles are fought within ourselves. Carry this 🏳‍🌈 and let it be a symbol of your inner harmony.",
      "My dear friend, take this 🏳‍🌈 and let it be a light in the darkness, reminding you of the power of love and unity.",
      "Life is a series of challenges, but with this 🏳‍🌈, may you find the courage to face them with grace and authenticity.",
      "Sometimes, the greatest wisdom comes from embracing our true selves. Carry this 🏳‍🌈 and let it guide you towards your own truth.",
      "Like a gentle breeze, let this 🏳‍🌈 remind you to spread kindness, compassion, and acceptance wherever you go.",
      "In the tapestry of life, every color is important. Embrace this 🏳‍🌈 and celebrate the vibrant diversity that makes us who we are.",
      "My young friend, take this 🏳‍🌈 and let it remind you that you are loved, cherished, and worthy of acceptance."
    ]
    msg.reply({ content: `Happy Pride ${msg.member.displayName}! ${u.rand(addons)}`, allowedMentions: { repliedUser: false } });
    prideRepliedUsers.push(msg.author.id);

    let member = await roleGuild.members.fetch(msg.member.id);
    if (!roleGuild) {
      roleGuild = await RoleClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
    }
    try {
      member.roles.add(snowflakes.roles.Holiday);
      console.log("Added holiday role to " + msg.member.displayName)
    } catch (error) {
      const modRequests = msg.guild.channels.cache.get(snowflakes.channels.modRequests);
      modRequests.send("I couldn't add the <@&" + snowflakes.roles.Holiday + " role to " + msg.member.displayName)
      throw error;
    }
    //create callback to remove user from array after 8 hours
    //calculate seconds until midnight
    let now = new Date();
    let midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0, 0);
    let milisecondsUntilMidnight = (midnight.valueOf() - now.valueOf());

    //set role to random hexcolor
    let color = Math.floor(Math.random() * 16777215).toString(16);
    try {
      roleGuild.roles.fetch(snowflakes.roles.Holiday).then(role => {
        role.setColor(color);
      });

    } catch (error) {
      console.log(error);
    }

    setTimeout(async () => {
      let index = prideRepliedUsers.indexOf(msg.author.id);
      if (index > -1) {
        prideRepliedUsers.splice(index, 1);
        await member.roles.remove(snowflakes.roles.Holiday);
      }
    }
      , milisecondsUntilMidnight);
    return;
  }

}

function youreWelcome(msg) {
  if (msg.content.toLowerCase().replaceAll(" ", "").indexOf("thankyoutavare") > -1) {
    msg.reply("You're very welcome!")
  }
}


const emojis = new Discord.Collection([
  [snowflakes.roles.BotMaster, snowflakes.emoji.bot],    // BotMasters - botIcon
  //["197050381270777857", snowflakes.emoji.upDawn], // Kritta - updawn

]);

async function tavareSawThatPing(msg) {

  emojis.set(msg.client.user.id, "👋");
  // privilagedPingPerson Pings
  for (const [privilagedPingPerson, emoji] of emojis) {
    if (msg.mentions.members.has(privilagedPingPerson) || msg.mentions.roles.has(privilagedPingPerson) || msg.mentions.members.some(m => m.roles.cache.has(privilagedPingPerson))) {
      await msg.react(emoji).catch(u.noop);
      await u.wait(1000)
      await msg.reactions.resolve(emoji).users.remove(msg.client.user.id);
    }
  }


}

removePrideRole = async () => {
  //return if it's not between midnight and 1am
  let now = new Date();
  if (now.getHours() != 0) {
    return;
  }

  const roleGuild = RoleClient.guilds.cache.get(snowflakes.guilds.PrimaryServer);
  const role = await roleGuild.roles.fetch(snowflakes.roles.Holiday);
  const members = await role.members.fetch();
  members.forEach(async member => {
    await member.roles.remove(role);
  }
  );

}

Module.addEvent("messageCreate", async (msg) => {
  if (msg.author.bot || (!msg.guild || msg.guild.id != snowflakes.guilds.PrimaryServer)) {
    return;
  }
  youreWelcome(msg)
  goodTime(msg);
  shhh(msg);
  tavareSawThatPing(msg);
  pride(msg);
})

//if it's june
if (new Date().getMonth() == 5) {
  Module.setClockwork(() => {
    try {
      return setInterval(removePrideRole, 60 * 60 * 1000);
    } catch (e) { u.errorHandler(e, "cakeOrJoinDay Clockwork Error"); }

  })
}
module.exports = Module;
