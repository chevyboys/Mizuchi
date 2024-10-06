const Augur = require("augurbot");
const snowflakes = require('../../../config/snowflakes.json');
const colors = [
  {
    name: "Raspberry",
    color: "#961547",
    award_threshold: 50
  },

  {
    name: "Orange",
    color: "#e07f35",
    award_threshold: 100
  },

  {
    name: "Gold",
    color: "#fffe7b",
    award_threshold: 150
  },

  {
    name: "Green",
    color: "#a7ff76",
    award_threshold: 200
  },
  {
    name: "Eucalyptus Green",
    color: "#28eaa2",
    award_threshold: 250
  },
  {
    name: "Mint",
    color: "#b9ffea",
    award_threshold: 300
  },
  {
    name: "frost",
    color: "#b9ebff",
    award_threshold: 350
  },
  {
    name: "Deep Purple",
    color: "#310c38",
    award_threshold: 400
  },
  {
    name: "Tavare Winter Blue",
    color: "#66a3d8",
    award_threshold: 450
  },
  {
    name: "Goddess Blue",
    color: "#9CA9FF",
    award_threshold: 500
  },
  {
    name: "Bingus Blurple",
    color: "#c4ccff",
    award_threshold: 550
  },
  {
    name: "Bot Master Amythest",
    color: "#e0c2ff",
    award_threshold: 1000
  },
  {
    name: "Infinite Blue",
    color: "#B5CDFF",
    award_threshold: 750
  },
  {
    name: "Licorice",
    color: "#141414",
    award_threshold: 2000
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


const avatar = "./avatar/Halloween.png";
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
    "🧚‍♂️"
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
          color: color.color,
          reason: "Holiday Event",
          position: guild.roles.cache.get(snowflakes.roles.Holiday[0]).position - 1
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
  //TODO: set the server icon to the event icon
  //TODO: reset the server icon to the default icon
  //TODO: set the server banner to the event banner
  //TODO: reset the server banner to the default banner
}

module.exports = event;

