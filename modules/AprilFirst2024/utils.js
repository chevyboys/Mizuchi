const snowflakes = require('../../config/snowflakes.json');
const colors = [
  {
    name: "Sword Sword",
    color: "#949494",
    award_threshold: 50
  },
  {
    name: "Cool Sword",
    color: "#c4ccff",
    award_threshold: 100
  },
  {
    name: "Tavare Sword",
    color: "#ffc17e",
    award_threshold: 150
  },
  {
    name: "Sword of Crazy",
    color: "#f000f0",
    award_threshold: 200
  },
  {
    name: "GodBeast Amythest",
    color: "#e0c2ff",
    award_threshold: 256
  },
  {
    name: "Goddess Tears",
    color: "#B5CDFF",
    award_threshold: 300
  },
  {
    name: "Tyrant's Shadow",
    color: "#141414",
    award_threshold: 500
  }
]

const roles = [
  {
    name: "Ghost Buster",
    hoist: true,
    icon: "./avatar/TavareChaos.png"
  },
  {
    name: "Corrupted by Power",
    hoist: true,
    icon: "./avatar/TavareChaosGrey.png"
  }
]


const avatar = "./avatar/winter.png";
/**
 * @module PristineWaters/utils
 */

/**
 * Utility module for Pristine Waters.
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
  channel: "1179847252315996210",
  avatar: avatar,
  colors: colors,
  roles: roles,
  emoji: [
    //several sweets emojis
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
    "👻",
    "👻",
    "👻",
    "👻",
    "👻",
    "👻",
    "🧛‍♂️",
    "🧛‍♀️",
    "🎃",
    "💀",
    "☠"


  ],
  odds: 30, //Percent out of 100
  /**
 * 
 * @param {Guild} guild 
 */
  generateRoles: async (guild) => {
    let promises = [];
    console.log("Generating roles");
    for (const color of colors) {
      let role = guild.roles.cache.find(r => r.name.toLowerCase() == `spooky ${color.name.toLowerCase()}`);

      if (!role) {
        role = await guild.roles.create({
          name: `Spooky ${color.name}`,
          color: color.color,
          reason: "Spooky Event",
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
      const role = guild.roles.cache.find(r => r.name.toLowerCase() == `spooky ${color.name.toLowerCase()}`);
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
}

module.exports = event;

