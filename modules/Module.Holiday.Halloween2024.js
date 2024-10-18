const Augur = require("augurbot");
const snowflakes = require("../config/snowflakes.json");
//const fs = require('fs');
//const config = require('../../config/config.json');
//const u = require('../../utils/Utils.Generic');
const event = require("./Halloween2024/utils.js");
const odds = event.odds;
const ParticipantManager = require("../modules/Halloween2024/Participant.js");
// const NPCSend = require("../../modules/PristineWaters/NPC");
// const moment = require("moment");
// const manipulateImage = require('../../modules/PristineWaters/imageManipulation');
// const embedColor = event.colors.find(c => c.name.toLowerCase().includes("blurple")).color || event.colors[event.colors.length - 1].color;
const endedButNotCleaned = false;

let Participants = new ParticipantManager();
const rolesClient = require("../utils/Utils.RolesLogin.js");
const rolesClientPrimaryGuild = rolesClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
const Module = new Augur.Module();

//############### Submodules ################
const Inventory = require('./Halloween2024/Inventory.js');
const Leaderboard = require('./Halloween2024/Leaderboard.js');
const Spam = require('./Halloween2024/Spam.js');
const Gift = require('./Halloween2024/Gift.js');
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
  //TODO: Implement this function
  // Event build and teardown
  //    Send announcement
  //    Create / Rename roles
  event.generateRoles(guild);
  //    Set bot icon
  event.setHolidayBotIcon(guild.client)
  //    Set bot name
  guild.client.user.setUsername("Twilight's Edge");
  //    Set bot status
  guild.client.user.setActivity(`More than ${ParticipantManager.getCurrentTotalHostileFound()} Ghosts caught!`);
  //    Starting announcement
  event.sendAnnouncements(guild);
  //    Set server icon
  event.setServerHolidayIcon(guild);
  //    Set server banner
  event.setServerHolidayBanner(guild);
  // Set event as active
  Active.setActive(true);


  //See https://docs.google.com/document/d/1p6DZ28IPDP8wNqNs-IUN_HjogpcMK7b5W7Auvm9NHq8/edit

}

async function end(guild) {
  //TODO: Implement this function
  // Unset colors
  // Delete / Unname roles
  event.cleanRoles(guild);
  // For each role in snowflakes.roles.Holiday, remove the role from all members
  for (const role of snowflakes.roles.Holiday) {
    event.cleanRoleMembers(role);
  };
  event.cleanHolidayBotIcon(guild.client);
  // Set bot name
  guild.client.user.setUsername("Tavare");
  // Set bot status
  guild.client.user.setActivity("The event has ended!");
  //set the server icon to the default icon
  event.cleanServerHolidayIcon(guild);
  //reset the server banner to the default banner
  event.cleanServerHolidayBanner(guild);
  //set the event as inactive
  Active.setActive(false);
}

async function dailyReset() {
  //TODO: Implement this function
  for (const role of snowflakes.roles.Holiday) {
    event.cleanRoleMembers(role);
  };
  //reset the status of all participants
  Participants.each(p => {
    p.status = "ACTIVE";
  })
}



//################ Module adds ################

Module.addEvent("reactionAdd", async (reaction, user) => {
  // Handle receiving a reaction
  Reaction.onAdd(reaction, user, Participants);
}).addInteractionCommand({
  name: "holiday",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    //TODO: Do something if the event is not yet active
    //Handle subcommands
    switch (interaction.options.getSubcommand()) {
      case "inventory": Inventory.command(interaction, Participants); break;
      case "leaderboard": Leaderboard.command(interaction, Participants); break;
      case "admin": Admin.command(interaction, Participants); break;
      case "help": Help.command(interaction); break;
      case "gift": Gift.command(interaction, Participants); break;
    }
  }
}).setClockwork(() => {
  //TODO: Implement this function
  //Handle daily reset at midnight (It has to be midnight because of how we are handling dates)
  //Handle end of event
}).addInteractionHandler({
  customId: `signUpForHolidayUpdates`, process: async (interaction) => {
    let member = await (await rolesClientPrimaryGuild).members.fetch(interaction.member);
    await member.roles.add(snowflakes.roles.HolidayUpdates);
    await interaction.editReply({ content: "You now have the <@&" + snowflakes.roles.Holiday + " role", ephemeral: true });
  }
}).addCommand({
  name: "flurry",
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg) => {
    msg.content.indexOf("end") > -1 ? Flurry.end(msg.channel) : Flurry.start(msg.channel);

  }
}).addCommand({
  name: "blizzard",
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg) => {
    msg.content.indexOf("end") > -1 ? Flurry.blizzard.end() : Flurry.blizzard.start();
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
  name: "reset",
  permissions: (msg) => event.isAdmin(msg.member),
  process: async (msg) => {
    dailyReset();
  }
});

//TODO: Add the ability to start the event
//TODO: Add the ability to end the event manually for testing
//TODO: Add the ability to reset the event daily manually for testing
//TODO: Add the ability for admins to trigger flurries (might go in reactionAdd)
//TODO: Add the ability for users to send and receive cards with adminLogging
//TODO: Add automatic slash command registration








module.exports = Module;