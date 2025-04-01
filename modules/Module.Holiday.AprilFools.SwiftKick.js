const Augur = require("augurbot");
const Module = new Augur.Module();
const snowflakes = require('../config/snowflakes.json');
const u = require('../utils/Utils.Generic');
const fs = require('fs');
const webhookSend = require('../utils/Webhook.js');
const { SlashCommandBuilder } = require('@discordjs/builders');



/**
 * Sends an NPC message to a channel using a webhook.
 * @param {string} channel - The channel to send the message to.
 * @param {Object} embedOptions - The options for the embedded message.
 * @param {Object} additionalMessageOptions - Additional options for the message.
 * @returns {Promise} - A promise that resolves when the message is sent.
 */
function NPCSend(channel, embedOptions, additionalMessageOptions) {
  let client = Module.client;
  additionalMessageOptions = additionalMessageOptions || {};
  embedOptions.color = //The bot's current color;
    client.guilds.cache.get(snowflakes.guilds.PrimaryServer)?.members?.cache.get(client.user.id)?.displayColor || "#000000";
  additionalMessageOptions.embeds = [embedOptions];
  return webhookSend.webhook(channel, "Guardian against Chaos", "./avatar/base.png", additionalMessageOptions);
}


let active;
if (!fs.existsSync('./data/holiday/active.json')) {
  fs.writeFileSync('./data/holiday/active.json', JSON.stringify({ active: false }));
  active = false;
} else {
  active = require('../data/holiday/active.json').active;
}
console.log("April fools event Active? " + active);

let holiday_role_map = {};
if (!fs.existsSync('./data/holiday/cache.json')) {
  fs.writeFileSync('./data/holiday/cache.json', JSON.stringify({ holiday_role_map: {} }));
  holiday_role_map = {};
} else {
  holiday_role_map = require('../data/holiday/cache.json').holiday_role_map;
}

//check the holiday_role_map for any roles that need to be restored


//Sample holiday role item
// member_id: {
//   roles: [role_id, role_id, role_id],
//   imprisoned_time: time

//if active.json is true, set active to true
let immuneRoles = [
  snowflakes.roles.BotMaster,
  snowflakes.roles.Admin,
  snowflakes.roles.Moderator,
  snowflakes.roles.LARPer,
  snowflakes.roles.WorldMaker,
  snowflakes.roles.BotAssistant,
  snowflakes.roles.CommunityGuide,
  snowflakes.roles.CakeDay,
  snowflakes.roles.Helper
]


function setActive(bool) {
  active = bool;
  fs.writeFileSync('./data/holiday/active.json', JSON.stringify({ active: bool }));
}

const roles = [
  {
    name: "Prisoner",
    hoist: true,
    icon: "./avatar/Halloween-Twilight.png",
    color: "#010101"
  },
  {
    name: "Gremlin",
    hoist: true,
    icon: "./avatar/AprilFools-Chaos.png",
    color: "#009922" //green
  }
]

const timeout_minutes = .5;

const avatar = "./avatar/AprilFools-Chaos.png";
async function eventProcess(interaction) {
  //handle the gremlin subcommand and the capture subcommand
  if (interaction.options.getSubcommand() == "gremlin") {
    //give the user the gremlin role
    let member = await interaction.guild.members.fetch(interaction.member.id);
    if (!member.roles.cache.has(snowflakes.roles.Holiday[1])) {
      let gremlinRole = interaction.guild.roles.cache.get(snowflakes.roles.Holiday[1]);
      await interaction.member.roles.add(gremlinRole);
      await interaction.reply(`You are now a gremlin! Use this subcommand again to return to normal.`);
    } else {
      let gremlinRole = interaction.guild.roles.cache.get(snowflakes.roles.Holiday[1]);
      await interaction.member.roles.remove(gremlinRole);
      await interaction.reply(`You are no longer a gremlin!`);
    }
  } else if (interaction.options.getSubcommand() == "capture") {
    //don't allow the user to capture bots!
    if (interaction.options.getMember("target").user.bot) {
      interaction.reply({ content: "You cannot capture an elemental without a contract!", ephemeral: true });
      return;
    }
    //check if the target user has the gremlin role
    if (!interaction.options.getMember("target").roles.cache.has(snowflakes.roles.Holiday[1])) {
      interaction.reply({ content: "That user is not a gremlin!", ephemeral: true });
      return;
    }
    if (interaction.options.getMember("target").id == interaction.member.id) {
      interaction.reply({ content: "You cannot capture yourself!", ephemeral: true });
      return;
    }
    //make sure the user is not already a prisoner
    if (interaction.options.getMember("target").roles.cache.has(snowflakes.roles.Holiday[0])) {
      interaction.reply({ content: "That user is already a prisoner!", ephemeral: true });
      return;
    }
    //send the user to the prison channel by first removing all the roles they have that we have permission to and that are not the gremlin role, then adding the prisoner role
    let target = interaction.options.getMember("target");
    let prisonerRole = interaction.guild.roles.cache.get(snowflakes.roles.Holiday[0]);
    let gremlinRole = interaction.guild.roles.cache.get(snowflakes.roles.Holiday[1]);
    let promises = [];
    target.roles.cache.forEach(r => {
      //don't try to remove server boosters or the everyone role
      //make sure we have permission to remove the role
      if (r.id != gremlinRole.id && r.id != interaction.guild.roles.everyone.id && r.id != interaction.guild.roles.premiumSubscriberRole.id && !immuneRoles.includes(r.id)) {
        //check if the role is higher than the bot's role
        if (r.position >= interaction.guild.me.roles.highest.position) {
          //do nothing
        } else {
          console.log("Removing role " + r.name + " from " + target.displayName);
          promises.push(target.roles.remove(r));
          if (!holiday_role_map[target.id]) {
            console.log("Creating new role map for " + target.displayName);
            holiday_role_map[target.id] = { roles: [], imprisoned_time: 0 };
          }
          console.log("Adding " + r.name + " to role map" + target.displayName);
          holiday_role_map[target.id].roles.push(r.id);

        }
      }
    });
    //write the role to the cache
    holiday_role_map[target.id].imprisoned_time = Date.now();
    fs.writeFileSync('./data/holiday/cache.json', JSON.stringify({ holiday_role_map: holiday_role_map }));
    //add the prisoner role
    promises.push(target.roles.add(prisonerRole));

    await Promise.all(promises).then(() => {
      //set timeout to restore roles
      setTimeout(() => {
        let target = interaction.options.getMember("target");
        let prisonerRole = interaction.guild.roles.cache.get(snowflakes.roles.Holiday[0]);
        let gremlinRole = interaction.guild.roles.cache.get(snowflakes.roles.Holiday[1]);
        let promises = [];
        //remove the prisoner role
        promises.push(target.roles.remove(prisonerRole));
        //add the gremlin role
        promises.push(target.roles.add(gremlinRole));
        //add the roles back
        holiday_role_map[target.id].roles.forEach(r => {
          promises.push(target.roles.add(r));
        });
        //write the role to the cache
        holiday_role_map[target.id] = null;
        Promise.all(promises);
        fs.writeFileSync('./data/holiday/cache.json', JSON.stringify({ holiday_role_map: holiday_role_map }));
      }, timeout_minutes * 60000);
    });
    interaction.reply({ content: "User has been captured!", ephemeral: true });
  }
}

let event = {
  channel: "1179847252315996210",
  avatar: avatar,
  roles: roles,
  /**
 * 
 * @param {Guild} guild 
 */
  generateRoles: async (guild) => {
    let promises = [];
    console.log("Generating roles");

    //update the bonus xp roles we already have
    //sort snowflakes.roles.Holiday by position
    let holidayRoles = snowflakes.roles.Holiday.sort((a, b) => guild.roles.cache.get(a).position - guild.roles.cache.get(b).position);
    for (const role of holidayRoles) {
      if (guild.premiumTier != "TIER_2" && guild.premiumTier != "TIER_3") {
        roles[holidayRoles.indexOf(role)].icon = undefined;
      }
      promises.push(guild.roles.edit(role, roles[holidayRoles.indexOf(role)]).then(discordRole => {
        roles[snowflakes.roles.Holiday.indexOf(role)].role = discordRole;
        console.log("Updated " + discordRole.name + " role");
      }
      ));

    }
    return await Promise.all(promises);
  },
  /**
   * 
   * @param {Guild} guild 
   */
  cleanRoles: async (guild) => {
    let promises = [];
    console.log("Cleaning roles");

    promises.push(guild.members.fetch().then(m => {
      let promisesRoles = [];
      for (const role of snowflakes.roles.Holiday) {
        promisesRoles.push(guild.roles.fetch(role).then(
          /**
          * @param {Role} r
          */
          r =>
            r.edit({
              name: "Holiday Role " + snowflakes.roles.Holiday.indexOf(role) + 1,
              color: "#000000",
              hoist: false,
              icon: null
            }).then(discordRole => {
              console.log("Updated " + discordRole.name + " role");
              return event.cleanRoleMembers(discordRole);
            }
            )
        )
        );
      }
      return Promise.all(promisesRoles);
    }
    ));

    return await Promise.all(promises);
  },
  cleanRoleMembers: (role) => {
    let removalPromises = [];
    role.members.forEach(m => {
      removalPromises.push(m.roles.remove(role));
    }
    )
    return Promise.all(removalPromises);
  },
  setHolidayBotIcon: (client) => {
    return client.user.setAvatar(avatar || ('./avatar/' + ("base.png")))
  },
  cleanHolidayBotIcon: (client) => {
    return client.user.setAvatar(('./avatar/' + ("base.png")))
  },
}

async function registerCommands() {
  console.log("Registering event commands");
  const guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
  const commands = guild.commands;
  const registeredCommand = await commands.create(
    new SlashCommandBuilder()
      .setName("event")
      .setDescription("Event commands")
      .addSubcommand(subcommand =>
        subcommand
          .setName("gremlin")
          .setDescription("Become a gremlin!")
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName("capture")
          .setDescription("Capture a gremlin!")
          .addUserOption(option =>
            option
              .setName("target")
              .setDescription("The gremlin to capture")
              .setRequired(true)
          )
      )
  );
  if (!registeredCommand) {
    console.error("Failed to register command");
    return;
  }

  return Module.client.interactions.commands.set(registeredCommand.id,
    {
      category: undefined,
      commandId: registeredCommand.id,
      description: registeredCommand.name,
      enabled: true,
      guildId: guild.id,
      hidden: false,
      info: registeredCommand.name,
      name: registeredCommand.name,
      permissions: true,
      process: (interaction) => eventProcess(interaction),
      syntax: "",
      execute: (interaction) => eventProcess(interaction)
    });
}

async function begin(msg) {
  await event.setHolidayBotIcon(msg.client);
  await event.generateRoles(msg.guild);
  registerCommands();
  setActive(true);
  NPCSend(msg.channel, u.embed({
    description: `It was a quite night, on the 31st of march, but many knew it was coming. The day of fools, the day of pranks, the day of jokes, the day of Chaos. But this year, things were different, for the lovers of order and freedom had a new ally against the gremlins of chaos, to trap them until the day was done. (Use /event gremlin to get the gremlin role and the bonus XP it brings, but beware, anyone may use the /event capture command to trap you in a channel for 5 minutes!)`,
  }),
    {
      content: `<@&${snowflakes.roles.Updates.AllUpdates}>, <@&${snowflakes.roles.Updates.MetaUpdates}>, <@&${snowflakes.roles.Updates.HolidayUpdates}>`,
      allowedMentions: { roles: [snowflakes.roles.Updates.AllUpdates, snowflakes.roles.Updates.MetaUpdates, snowflakes.roles.Updates.HolidayUpdates] }
    }
  );

}

Module.addCommand({
  name: "begin",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: (msg) => msg.member.roles.cache.has(snowflakes.roles.BotMaster),
  process: async (msg) => {
    await begin(msg);
    await msg.react("✔");
  }
}).addCommand({
  name: "clean",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: (msg) => msg.member.roles.cache.has(snowflakes.roles.BotMaster),
  process: async (msg) => {
    await event.cleanRoles(msg.guild);
    await event.cleanHolidayBotIcon(msg.client);
    //delete the active.json file and the cache.json file
    fs.unlinkSync('./data/holiday/active.json');
    fs.unlinkSync('./data/holiday/cache.json');
    await msg.channel.send("Roles cleaned");
  }
}).addCommand({
  //add a command to show all the roles that have send messages permission guild wide or in a specific channel
  name: "showroles",
  guild: snowflakes.guilds.PrimaryServer,
  process: async (msg) => {
    let roles = msg.guild.roles.cache.filter(r => r.permissions.has("SEND_MESSAGES"));
    let roleString = "";
    roles.forEach(r => {
      roleString += r.name + "\n";
    });
    let channels = msg.guild.channels.cache.filter(c => c.permissionsFor(msg.guild.me).has("SEND_MESSAGES"));
    channels.forEach(c => {
      //check to see if any roles have send messages permission in the channel
      let Croles = msg.guild.roles.cache.filter(r => c.permissionsFor(r).has("SEND_MESSAGES"));
      //remove the @everyone role and any roles that are already in the list
      Croles.delete(msg.guild.roles.everyone.id);
      roles.forEach(r => {
        Croles.delete(r.id);
      });

      if (Croles.size > 0) {
        roleString += `Roles with send messages permission in ${c.name}:\n`;
        Croles.forEach(r => {
          roleString += r.name + "\n";
        });
      }
    });
    await msg.channel.send(roleString);
  }
}).addEvent("ready", async () => {
  if (active) {
    let promises = [];
    for (const member in holiday_role_map) {
      if (holiday_role_map[member]) {
        let member_id = member;
        let member_roles = holiday_role_map[member].roles;
        let imprisoned_time = holiday_role_map[member].imprisoned_time;
        let time = Date.now();
        if (time - imprisoned_time > timeout_minutes * 60000) {
          //restore the roles
          let guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
          let member = guild.members.cache.get(member_id);
          let promisesRoles = [];
          member_roles.forEach(r => {
            promisesRoles.push(guild.roles.fetch(r).then(role => {
              member.roles.add(role);
            }));
          });
          promises.push(Promise.all(promisesRoles).then(() => {
            //remove the prisoner role
            let prisonerRole = guild.roles.cache.get(snowflakes.roles.Holiday[0]);
            member.roles.remove(prisonerRole);
            //add the gremlin role
            let gremlinRole = guild.roles.cache.get(snowflakes.roles.Holiday[1]);
            member.roles.add(gremlinRole);
            //remove the role from the cache
            holiday_role_map[member_id] = null;
            fs.writeFileSync('./data/holiday/cache.json', JSON.stringify({ holiday_role_map: holiday_role_map }));
          }));
        }
      }
    }
    Promise.all(promises);
    //wait for other commands to be registered, then register the event commands
    let wait = setTimeout(() => {
      registerCommands();
    }, 5000);
  }
});

// Slash command:



module.exports = Module;