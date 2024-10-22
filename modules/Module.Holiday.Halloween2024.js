const Augur = require("augurbot");
const snowflakes = require("../config/snowflakes.json");
//const fs = require('fs');
//const config = require('../../config/config.json');
const u = require('../utils/Utils.Generic.js');
const event = require("./Halloween2024/utils.js");
const moment = require("moment");
const odds = event.odds;
const ParticipantManager = require("../modules/Halloween2024/Participant.js");
const NPCSend = require("./Halloween2024/NPC.js");
// const moment = require("moment");
// const manipulateImage = require('../../modules/PristineWaters/imageManipulation');
// const embedColor = event.colors.find(c => c.name.toLowerCase().includes("blurple")).color || event.colors[event.colors.length - 1].color;
const endedButNotCleaned = false;
const fs = require('fs');

let Participants = new ParticipantManager();
const rolesClient = require("../utils/Utils.RolesLogin.js");
const rolesClientPrimaryGuild = rolesClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
const Module = new Augur.Module();

//############### Submodules ################
const Inventory = require('./Halloween2024/Inventory.js');
const Leaderboard = require('./Halloween2024/Leaderboard.js');
const Spam = require('./Halloween2024/Spam.js');
const Gift = {
  command: (interaction, Participants) => { return interaction.reply("Coming soon!") }, //TODO: Implement this function
}//require('./Halloween2024/Gift.js');
const Admin = require('./Halloween2024/Admin.js');
const Flurry = require('./Halloween2024/Flurry.js');
const Help = require('./Halloween2024/Help.js');
const Reaction = require('./Halloween2024/Reaction.js');
const Active = require('./Halloween2024/Active.js');
const { Guild } = require("discord.js");



//############### Functions ################
//get random emoji from eventEmoji
function getRandomEmoji() {
  return event.emoji[Math.floor(Math.random() * event.emoji.length)];
}


/**
 * 
 * @param {Guild} guild 
 */

async function begin(guild) {
  // Event build and teardown
  //    Send announcement
  //    Create / Rename roles
  await event.generateRoles(guild);
  //    Set bot icon
  await event.setHolidayBotIcon(guild.client)
  //    Set bot name
  await guild.client.user.setUsername("Twilight's Edge");
  await guild.members.cache.get(guild.client.user.id).setNickname("Twilight's Edge");
  //    Set bot status
  await guild.client.user.setActivity({ type: "WATCHING", name: `${Participants.totalEventHostile()} Ghosts caught!` });
  //    Starting announcement
  await event.sendAnnouncements(guild);
  //    Set server icon
  await event.setServerHolidayIcon(guild); //Failing silently currently, need to investigate
  //    Set server banner
  await event.setServerHolidayBanner(guild); //Failing silently currently, need to investigate
  // Set event as active
  await Active.setActive(true);


  //See https://docs.google.com/document/d/1p6DZ28IPDP8wNqNs-IUN_HjogpcMK7b5W7Auvm9NHq8/edit

}

async function end(guild) {
  // Unset colors
  // Delete / Unname roles
  await event.cleanRoles(guild);
  // For each role in snowflakes.roles.Holiday, remove the role from all members
  for (const role of snowflakes.roles.Holiday) {
    const guildRole = await guild.roles.fetch(role);
    await event.cleanRoleMembers(guildRole);
  };
  await event.cleanHolidayBotIcon(guild.client);
  // Set bot name
  await guild.client.user.setUsername("Tavare");
  await guild.members.cache.get(guild.client.user.id).setNickname("Tavare");
  // Set bot status
  await guild.client.user.setActivity(null);
  //set the server icon to the default icon
  await event.cleanServerHolidayIcon(guild);
  //reset the server banner to the default banner
  await event.cleanServerHolidayBanner(guild);
  //set the event as inactive
  await Active.setActive(false);
}

async function dailyReset(guild) {
  await Promise.all(Participants.map(async (v, k) => {
    v.status = "ACTIVE";
  }));
  Participants.write();

  for (const role of snowflakes.roles.Holiday) {
    const guildRole = await guild.roles.fetch(role);
    await event.cleanRoleMembers(guildRole);
  };

  await u.errorLog.send({ embeds: [u.embed({ title: "Daily Reset", description: "The event has been reset for the day." })] });

}

let today = new Date().getDate();

//################ Module adds ################
let i = 0;
Module.addEvent("messageReactionAdd", async (reaction, user) => {
  i++;
  if (i % 10 == 0) {
    Participants.write();
  }
  // Handle receiving a reaction
  Reaction.onAdd(reaction, user, Participants);
}).addInteractionCommand({
  name: "holiday",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    if (!Active.getActive) {
      await interaction.reply({ content: "The event has not yet begun. Please check back later.", ephemeral: true });
      return;
    }
    //Handle subcommands
    switch (interaction.options.getSubcommand()) {
      case "inventory": Inventory.command(interaction, Participants); break;
      case "leaderboard": Leaderboard.command(interaction, Participants); break;
      case "admin": Admin.command(interaction, Participants); break;
      case "help": Help.command(interaction); break;
      case "gift": Gift.command(interaction, Participants); break;
    }
  }
}).setClockwork(async () => {

  try {
    return setInterval(async () => {
      today = new Date().getDate();
      if (!Active.getActive) return;
      if (today == new Date().getDate()) return;
      let guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
      await dailyReset(guild);
    }

      , 60 * 1000);
  } catch (e) { u.errorHandler(e, "event Clockwork Error"); }
}).addEvent('interactionCreate', async (interaction) => {
  console.log(interaction);
  if (interaction.customId == "signUpForHolidayUpdates") {
    interaction.deferUpdate();
    let member = await (await rolesClientPrimaryGuild).members.fetch(interaction.member);
    await member.roles.add(snowflakes.roles.Updates.HolidayUpdates);
    await interaction.followUp({ content: "You have been signed up for holiday updates!", ephemeral: true });
  }
}).addCommand({
  name: "flurry",
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg) => {
    msg.content.indexOf("end") > -1 ? Flurry.end(msg.channel) : Flurry.start(msg.channel);
    await msg.react("✅");
    u.clean(msg, 0);
  }
}).addCommand({
  name: "blizzard",
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg) => {
    msg.content.indexOf("end") > -1 ? Flurry.blizzard.end() : Flurry.blizzard.start();
    u.clean(msg, 0);
  }
}).setInit(() => {
  Flurry.init();
  Participants = new ParticipantManager();
}).addCommand({
  name: "start",
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg) => {
    begin(msg.guild);
    msg.reply("The event has begun!");
  }
}).addCommand({
  name: "end",
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg) => {
    end(msg.guild);
  }
}).addCommand({
  name: "write",
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg) => {
    Participants.write();
  }
}).addCommand({
  name: "npc",
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg, suffix) => {
    NPCSend(msg.channel, u.embed({ description: suffix }));
    u.clean(msg, 0);
  }

}).addCommand({
  name: "resetevent",
  aliases: ["reset", "dailyreset"],
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg) => {
    const participantsRequire = require("../data/holiday/participants.json");
    const today = new Date().getDate();

    for (const p of participantsRequire) {
      let todayHostile = p.Hostile.find(h => h.key == today)?.value || 0;
      // if yesterday's count exists, add today's count to yesterday's count
      let yesterdayHostile = (await p.Hostile.find(h => h.key == today - 1))?.value || 0;

      if (todayHostile) {
        if (yesterdayHostile) {
          p.Hostile.find(h => h.key == today - 1).value = yesterdayHostile + todayHostile;
        } else {
          p.Hostile.push({ key: today - 1, value: todayHostile });
        }
        (p.Hostile.find(h => h.key == today).value = 0);
      }
    }

    await dailyReset(msg.guild);
    msg.react("✅");
  }
}).addEvent("messageCreate", async (msg) => {
  // Handle receiving a message
  if (!Active.getActive) return;
  if (msg.channel.type == "dm") return;
  if ((await Spam.isSpam(msg))) return;
  //if there is a flurry or if a random chance based on odds as a percentage is met
  let roll = Math.floor(Math.random() * 100);
  let flurryReaction = await Flurry.reactBecauseOfFlurry(msg); //false &&
  //console.log(flurryReaction);
  /*if (flurryReaction) {
    console.log("Flurry Reaction: True");
  } */
  if (flurryReaction == true || roll < odds || msg.channel.id == event.channel) {
    //console.log(roll);
    //console.log(flurryReaction);
    await Reaction.react(msg);
    //remove the reaction in ten minutes
    setTimeout(() => {
      Reaction.remove(msg);
    }, 10 * 60 * 1000);
  }

});

//TODO: Add automatic slash command registration
//TODO: Allow people to get masks by hitting 50 ghosts once inventory comes out










module.exports = Module;