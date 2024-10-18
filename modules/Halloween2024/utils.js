const Augur = require("augurbot");
const snowflakes = require('../../config/snowflakes.json');
const NPCSend = require("./NPC.js");
const u = require("../../utils/Utils.Generic");
const colors = [
  //TODO: change the colors, instead of a reward threshold
  //    we should have a role icon
  {
    name: "Raspberry",
    color: "#961547",
    role_icon: "./img/server/Halloween/icon.png"
  },

  {
    name: "Orange",
    color: "#e07f35",
    role_icon: "./img/server/Halloween/icon.png"
  },

  {
    name: "Gold",
    color: "#fffe7b",
    role_icon: "./img/server/Halloween/icon.png"
  },

  {
    name: "Green",
    color: "#a7ff76",
    role_icon: "./img/server/Halloween/icon.png"
  },
  {
    name: "Eucalyptus Green",
    color: "#28eaa2",
    role_icon: "./img/server/Halloween/icon.png"
  },
  {
    name: "Mint",
    color: "#b9ffea",
    role_icon: "./img/server/Halloween/icon.png"
  },
  {
    name: "frost",
    color: "#b9ebff",
    role_icon: "./img/server/Halloween/icon.png"
  },
  {
    name: "Deep Purple",
    color: "#310c38",
    role_icon: "./img/server/Halloween/icon.png"
  },
  {
    name: "Tavare Winter Blue",
    color: "#66a3d8",
    role_icon: "./img/server/Halloween/icon.png"
  },
  {
    name: "Goddess Blue",
    color: "#9CA9FF",
    role_icon: "./img/server/Halloween/icon.png"
  },
  {
    name: "Bingus Blurple",
    color: "#c4ccff",
    role_icon: "./img/server/Halloween/icon.png"
  }
]

const roles = [
  {
    name: "Spirit Hunter",
    hoist: true,
    icon: ""
  },
  {
    name: "Corrupted",
    hoist: true,
    icon: ""
  }
]


const avatar = "./avatar/Halloween-Twilight.png";
const serverPFP = "./img/server/Halloween/icon.png";
const serverBanner = "./img/server/Halloween/banner.png";
/**
 * @module Mask of theWaters/utils
 */

/**
 * Utility module for Holiday.
 * @namespace
 * @property {Array<Object>} colors - Array of color objects.
 * @property {string} colors[].name - The name of the color.
 * @property {string} colors[].color - The hex code of the color.
 * @property {Array<Object>} roles - Array of role objects.
 * @property {string} roles[].name - The name of the role.
 * @property {string} roles[].color - The hex code of the role's color.
 * @property {boolean} roles[].hoist - Whether the role should be hoisted.
 * @property {string} roles[].icon - The path to the role's icon.
 * @property {Array<string>} emoji - Array of emojis.
 * @property {number} odds - The odds of event values being triggered as a percentage.
 */

let event = {
  abilityCooldownMinutes: 10,
  avatar: avatar,
  colors: colors,
  roles: roles,
  emoji: [
    //several emojis
    "👻",
    "👻",
    "👻",
    "👻",
    "👻",
    "👻",
    "👻",
    "👻",
    "👻",
    "👻",
    //"🧚‍♂️"
  ],
  odds: 8,
  /**
 * 
 * @param {Guild} guild 
 */
  generateRoles: async (guild) => {
    let promises = [];
    console.log("Generating roles");
    for (const color of colors) {
      let role = guild.roles.cache.find(r => r.name.toLowerCase() == `mask of the ${color.name.toLowerCase()}`);



      if (!role) {
        role = await guild.roles.create({
          name: `Mask of the ${color.name}`,
          //color: color.color,
          icon: guild.premiumTier > 1 ? color.role_icon : undefined,
          reason: "Holiday Event",
          position: guild.roles.cache.get(snowflakes.roles.Holiday[0]).position + 1
        });
        console.log("Created " + role.name + " role");
      } else {
        console.log("Found " + role.name + " role");
      }
      roles.push(role);
    }

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

    for (const color of colors) {
      const role = guild.roles.cache.find(r => r.name.toLowerCase() == `mask of the ${color.name.toLowerCase()}`);
      if (role) {
        promises.push(role.delete());
        console.log("Deleted " + role.name + " role");
      }
    }
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
  //set the server icon to the event icon
  setServerHolidayIcon: async (guild) => {
    if (serverPFP && serverPFP != "") {
      return await guild.setIcon(serverPFP);
    }
  },
  //reset the server icon to the default icon
  cleanServerHolidayIcon: async (guild) => {
    return await guild.setIcon("./img/server/default/icon.png");
  },
  //set the server banner to the event banner
  setServerHolidayBanner: (guild) => {
    if (guild.premiumTier > 1 && serverBanner && serverBanner != "") {
      guild.setBanner(serverBanner);
    }
  },
  //reset the server banner to the default banner
  cleanServerHolidayBanner: async (guild) => {
    if (guild.premiumTier > 1) return await guild.setBanner("./img/server/default/banner.png");
  },
  //send the server-announcements announcement
  sendAnnouncements: async (guild) => {
    //Starting announcement
    //      Guide to disable emoji
    //      Explanation of events
    //      Lore explanation
    //      Ebbing of the tides(Celebrates birth and death)
    //      Explaining that spam will not help you
    //      Clarify that there is NOT a lore drop this event

    //get the channel named server-announcements
    let channel = guild.channels.cache.find(c => c.name == "server-announcements");
    if (!channel) {
      console.log("No server-announcements channel found");
      return;
    }
    console.log("Found server-announcements channel");
    //send the announcement
    return await NPCSend(channel,
      {
        "description": ">>> *Ah, the Festival of Ebbing Tides, a Dalen festival celebrating the cycle of birth and death. It is said that on the last day of Wilting, the spirits of the dead roam in search of meaning. Benevolent spirits will often seek out their loved ones, but vicious ghosts will need to be exorcised. During this time, it is common to wear costumes designed to scare away vengeful spirits.*",
        "fields": [
          {
            "name": "Description:",
            "value": "This is a server event to celebrate both in world and out of world holidays. We have these periodically. The event can be interacted with by finding reactions to messages, or by using the event command. Send messages to see where the reactions pop up. You may receive various direct messages and bonus XP roles if you participate in the event to help you on your climb to Emerald\n\nAs a note, spam filters will penalize the scores people who send a lot of low effort posts. Make sure you're on topic for the channels you are in. Server rules will still apply.\n\nThe Book Channels and General have been warded against incursion and will be immune to certain parts of the event.",
          },
          {
            "name": "How to opt out:",
            "value": "If you don't like seeing lots of emoji reacts:\n 1. Open your discord user settings\n 2. Open the `Chat` menu\n 3. Disable `Show emoji reactions on messages`",
            "inline": true
          }
        ],
        "title": "The Ebbing of The Tides  (October 12th-31st)",
        "color": 0,
        "footer": {
          "text": "Event Traits:\nSpam filter: ✅ \nReaction Based: ✅\nSecret code: ❔\nCanon Lore drop: ❌\nWorldmaker involvement: ❌ "
        }
      }, {
      content: `<@&${snowflakes.roles.Updates.AllUpdates}>, <@&${snowflakes.roles.Updates.MetaUpdates}>, <@&${snowflakes.roles.Updates.HolidayUpdates}>`,
      allowedMentions: { roles: [snowflakes.roles.Updates.AllUpdates, snowflakes.roles.Updates.MetaUpdates, snowflakes.roles.Updates.HolidayUpdates] },
      components: [
        {
          "type": 1,
          "components": [
            {
              "type": 2,
              "style": 1,
              "label": "Sign up for Event Pings",
              "custom_id": "signUpForHolidayUpdates"
            }
          ]
        }
      ],
    });

    //    TODO: Mod starting message
    //      Going over mod powers
    //      - &flurry and &flurry end command
    //      - &blizzard and &blizzard end command
    //      - 🔮 reaction
    //TODO:

  },
  //event admin permissions check
  isAdmin: (member) => {
    return member.permissions.has("ADMINISTRATOR")
      || member.roles.cache.has(snowflakes.roles.Moderator)
      || member.roles.cache.has(snowflakes.roles.Admin)
      || member.roles.cache.has(snowflakes.roles.BotAssistant)
      || member.roles.cache.has(snowflakes.roles.BotMaster);
  },
}

module.exports = event;

