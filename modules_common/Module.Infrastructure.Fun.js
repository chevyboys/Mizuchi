const Augur = require("augurbot"),
  Module = new Augur.Module(),
  Discord = require("discord.js"),
  u = require("../utils/Utils.Generic");
const RoleClient = require("../utils/Utils.RolesLogin");
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
const { distance, closest } = require('fastest-levenshtein');

async function shhh(msg) {
  try {
    if (!Module.config.snowflakes.channels.secret) return;
    let content = msg.content.toLowerCase().replaceAll(" ", "").replaceAll("-", "").replaceAll("_", "")
    let channelName = msg.guild.channels.cache.get(Module.config.snowflakes.channels.secret).name.toLowerCase().replaceAll(" ", "").replaceAll("-", "").replaceAll("_", "")
    if (content?.indexOf(Module.config.snowflakes.channels.secret) > -1 || content?.indexOf(channelName) > -1) {
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
  if (msg.channel != Module.config.snowflakes.channels.general) return;
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

// helper func for pride to check if provided author has Holiday[0] in their roles
function hasPrideRole(member) {
  if (member.roles.cache.has(Module.config.snowflakes.roles.Holiday[0])) {
    return true;
  }
  return false;
}

let roleGuild;
let prideRepliedUsers = [];
/**determines if the bot should respond with Happy pride, then does so 
 * @param {Discord.Message} msg
*/
async function pride(msg) {
  if (msg.author.bot || prideRepliedUsers.includes(msg.author.id) || hasPrideRole(msg.member)) return;
  if (msg.channel != Module.config.snowflakes.channels.general) return;
  let mon = new Date().getMonth();
  if (mon != 5) return
  let content = msg?.content?.toLowerCase();
  //remove all whitespace
  let spacelessContent = content.replaceAll(/\s/g, "").split("");
  //remove consecutive duplicates
  for (let i = 0; i < spacelessContent.length; i++) {
    if (spacelessContent[i] == spacelessContent[i + 1]) {
      spacelessContent.splice(i, 1);
      i--;
    }
  }
  spacelessContent = spacelessContent.join("");


  if (mon != 5) return
  if (!roleGuild) {
    roleGuild = await msg.guild.fetch();

  }
  let enabled = false;
  if (spacelessContent.indexOf("hapypride") > -1
    || spacelessContent.indexOf("pridetavare") > -1
    || (spacelessContent.indexOf("pride") > -1 && ["397075050726948864", "226544838085050369", "624007136061685761", "610636873559441419"].indexOf(msg.author.id) > -1)
    || (msg.mentions.members.has(msg.client.user.id) && spacelessContent.indexOf("pride"))) enabled = true;
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
      "Have a 🏳‍🌈!",
      "You are fabulous! ",
      "You deserve love and acceptance.",
      "Radiance appreciates your presence here.",
      "Go drink some water, you deserve it.",
      "Radiance reminds you that you are valid, and we care about you.",
      "Remember to take care of yourself this month.",
      "You are excellent, and we are glad you are here.",
      "Thanks for being here.",
      "Radiance is proud of you.",
      "🏳‍🌈🏳‍🌈🏳‍🌈🏳‍🌈🏳‍🌈🏳‍🌈🏳‍🌈🏳‍🌈🏳‍🌈🏳‍🌈",
      "\n🟥🟥🟥🟥🟥🟥\n🟧🟧🟧🟧🟧🟧\n🟨🟨🟨🟨🟨🟨\n🟩🟩🟩🟩🟩🟩\n🟦🟦🟦🟦🟦🟦\n🟪🟪🟪🟪🟪🟪"
    ]
    //on a one in 100 chance, replace the addon with an easter egg
    if (getRandomInt(100) < 5) {
      addons = [
        "You have finally enough pylons 💎🏳‍🌈",
        "Wuv, twue wuv is what bwings us togethar today🌈",
        "⬆⬇⬆⬇",
        "Radiance, thy name is " + msg.member.displayName,
        // "||Find the secret: https://wydds.cc/doc_storage.html||",
      ]

    }
    //set role to random hexcolor
    let hexbase = Math.random() * 16777215;
    let color = Math.floor(hexbase).toString(16);
    let makeHolographic = getRandomInt(100) < 1; // 1% chance to trigger holographic role effects by adding a random tertiary color
    try {
      roleGuild.roles.fetch(Module.config.snowflakes.roles.Holiday[0]).then(async role => {
        //await role.setColor(color);
        await setRandomRoleColors(Module.config.snowflakes.guilds.PrimaryServer, Module.config.snowflakes.roles.Holiday[0], Module.client.token, hexbase, makeHolographic);
      });

    } catch (error) {
      console.log(error);
    }


    msg.reply({ content: `Happy${makeHolographic ? " ***Holographic***" : ""} Pride ${msg.member.displayName}! ${u.rand(addons)}\n\n||By the way, your color for today is #${color}||`, allowedMentions: { repliedUser: false } });
    prideRepliedUsers.push(msg.author.id);

    let member = await roleGuild.members.fetch(msg.member.id);
    if (!roleGuild) {
      roleGuild = await msg.guild.fetch();
    }
    try {
      await member.roles.add(Module.config.snowflakes.roles.Holiday[0]);
      console.log("Added holiday role to " + msg.member.displayName)
    } catch (error) {
      const modRequests = msg.guild.channels.cache.get(Module.config.snowflakes.channels.modRequests);
      modRequests.send("I couldn't add the <@&" + Module.config.snowflakes.roles.Holiday[0] + " role to " + msg.member.displayName)
      throw error;
    }
}

function lightenHex(hex, percent) {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Convert the hex string into Red, Green, and Blue integers
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Push each color closer to 255 (white) based on the percentage
  r = Math.min(255, Math.floor(r + (255 - r) * percent));
  g = Math.min(255, Math.floor(g + (255 - g) * percent));
  b = Math.min(255, Math.floor(b + (255 - b) * percent));

  // Convert back to hex and ensure each part is 2 characters long
  let lighterHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

  return lighterHex;
}

/**
 * Updates a Discord role to have random primary and secondary colors.
 * * @param {string} guildId - The ID of the guild (server).
 * @param {string} roleId - The ID of the role to update.
 * @param {string} botToken - Your Discord bot token.
 * @returns {Promise<Object>} The updated role object returned by Discord.
 */
async function setRandomRoleColors(guildId, roleId, botToken, randomPrimary, makeHolographic = false) {
  // Generate random integers between 0 and 16777215 (0xFFFFFF)
  randomPrimary = randomPrimary || Math.floor(Math.random() * 16777216);
  let randomSecondary = parseInt(lightenHex("#" + randomPrimary.toString(16), 0.5).replace(/^#/, ''), 16);

  const endpoint = `https://discord.com/api/v10/guilds/${guildId}/roles/${roleId}`;

  const payload = {
    colors: {
      primary_color: randomPrimary,
      secondary_color: randomSecondary,
      // one in a hundred chance to have a tertiary color that is a random color to trigger holographic role effects
      tertiary_color: makeHolographic ? Math.floor(Math.random() * 16777216) : null
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Discord API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const updatedRole = await response.json();
    console.log(`Successfully updated role colors! Primary: ${randomPrimary}, Secondary: ${randomSecondary}`);

    return updatedRole;

  } catch (error) {
    console.error("Failed to update role colors:", error);
    throw error;
  }
}

function youreWelcome(msg) {
  if (msg.content.toLowerCase().replaceAll(" ", "").indexOf("thankyoutavare") > -1) {
    msg.reply("You're very welcome!")
  }
}


const emojis = new Discord.Collection([
  //[snowflakes.roles.BotMaster, snowflakes.emoji.bot],    // BotMasters - botIcon
  //["197050381270777857", snowflakes.emoji.upDawn], // Kritta - updawn

]);

async function tavareSawThatPing(msg) {

  emojis.set(msg.client.user.id, "👋");
  // privilagedPingPerson Pings
  for (const [privilagedPingPerson, emoji] of emojis) {
    if (msg.mentions.members.has(privilagedPingPerson) || msg.mentions.roles.has(privilagedPingPerson) || msg.mentions.members.some(m => m.roles.cache.has(privilagedPingPerson))) {
      await msg.react(emoji).catch(u.noop);
      await u.wait(1000);
      await msg.reactions.cache.get(emoji).users.remove(msg.client.user.id).catch(u.noop);
    }
  }
}

removePrideRole = async (Module) => {
  //disabling roll off. May enable at a future point
  //return if it's not between midnight and 1am
  let now = new Date();
  if (now.getHours() != 0) {
    return;
  }

  const roleGuild = await Module.client.guilds.fetch(Module.config.snowflakes.guilds.PrimaryServer);
  const role = await roleGuild.roles.fetch(Module.config.snowflakes.roles.Holiday[0]);
  const members = await role.members;
  members.forEach(async member => {
    await member.roles.remove(role);
    if (prideRepliedUsers.includes(member.id)) {
      let index = prideRepliedUsers.indexOf(member.id);
      if (index > -1) {
        prideRepliedUsers.splice(index, 1);
  }
  );
}

Module.addEvent("messageCreate", async (msg) => {
  if (msg.author.bot || (!msg.guild || msg.guild.id != Module.config.snowflakes.guilds.PrimaryServer)) {
    return;
  }
  youreWelcome(msg)
  goodTime(msg);
  shhh(msg);
  tavareSawThatPing(msg);
  pride(msg);
})

module.exports = Module;
