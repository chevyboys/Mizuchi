const snowflakes = require("../config/snowflakes.json");
const config = require("../config/config.json");
const u = require("../utils/Utils.Generic");
const Augur = require("augurbot");
const Module = new Augur.Module;
const moment = require("moment");
let odds = 60;
let started = false;
const holidays = [
  {
    name: 'Halloween',
    description: "*T'was the night of all hallows eve when our brave adventurers gathered together in the climbers court. But as they sat down to dine together, they heard a dark laughter from hundreds of throats. It seems the mana construct makers had delved too deep, and released the spirits hidden in a dark chamber deep inside the code. A dark fate awaited the brave adventurers if they failed to trap each of the spirits.*",
    emoji: "👻",
    color: "WHITE"

  }
]

// on server shutdown this cache should be written to database and also be cleared at the end of event (with database clear too)
let cache = [];
class Participant {
  #_user;
  #_count = 1;

  constructor(user) {
    this.#_user = user;
  }

  updateCount() {
    this.#_count++;
  }

  get count() {
    return this.#_count;
  }

  get user() {
    return this.#_user;
  }

}

let haunted = [];
let hauntedChannel = null;

Module.addEvent("messageReactionAdd", async (reaction, user) => {
  let message = reaction.message;
  let channel = message.guild.channels.cache.get(snowflakes.channels.botSpam);
  if ((reaction.emoji.toString().toLowerCase().indexOf(holidays[0].emoji) > -1) && !user.bot && reaction.users.cache.has(message.client.user.id)) {
    //if the person is haunted, simply remove their reaction and do nothing else
    if (haunted.includes(user.id)) {
      reaction.users.remove(user.id);
      return;
    }


    const member = message.guild.members.cache.get(user.id);
    try {
      const index = cache.findIndex(element => user == element.user);
      if (index != -1) {
        const userCount = cache[index];
        userCount.updateCount();
        // incase this is changed later instead of if statments
        switch (userCount.count) {
          case 5:
            //if the user already has the role, don't do anything
            if (member.roles.cache.has(snowflakes.roles.Holiday)) break;
            u.addRoles(member, snowflakes.roles.Holiday);
            channel.send({
              content: `<@${user.id}> has captured enough spirits and has become a <@&${snowflakes.roles.Holiday}> until the next reset (at cakeday announcement time)`,
              allowedMentions: { parse: ["users"] }
            });
            break;
          case 10: channel.send({
            content: `<@${user.id}> has captured too many spirits and is now haunted and they won't be able to capture any more spirits for 5 minutes!`,
            allowedMentions: { parse: ["users"] }
          });
            //add user to haunted list, and remove after 5 minutes
            haunted.push(user.id);
            setTimeout(() => {
              haunted.splice(haunted.indexOf(user.id), 1);
            }, 1000 * 60 * 5);
            break;

        }

      } else {
        cache.push(new Participant(user));
      }

      channel.send({
        content: `<@${user.id}> found a spirit in <#${message.channel.id}>`,
        allowedMentions: { parse: ["users"] }
      });
      reaction.users.remove(message.client.user.id);
    } catch (error) { u.errorHandler(error, "Holiday reaction error"); }
  }
  else if (reaction.emoji.toString().toLowerCase().indexOf("🔮") > -1 && config.AdminIds.includes(user.id)) {
    reaction.remove()
    await reaction.message.react(holidays[0].emoji);
  }
}).addEvent("messageCreate", async (msg) => {

  if (
    msg.author &&
    !msg.webhookId &&
    !msg.author.bot &&
    ((Math.floor(Math.random() * odds) > odds - 2))
  ) {
    msg.react(holidays[0].emoji)
  } else if (
    //if a user is haunted, they have a 90 percent chance of spawning a spirit
    haunted.includes(msg.author.id) &&
    //random number between 0 and 100
    Math.floor(Math.random() * 100) > 90
  ) {
    msg.react(holidays[0].emoji)
  } else if (hauntedChannel) {
    msg.react(holidays[0].emoji)
  }
  else {
    if (config.AdminIds.includes(msg.author.id) && msg.content.indexOf("🔮") > -1) {
      msg.delete();
      if (started) {
        msg.channel.send("*A surge of spirits is rising in this channel*");
        hauntedChannel = msg.channel.id;
        //in ten minutes the channel will be cleared
        setTimeout(() => {
          hauntedChannel = null;
          msg.channel.send("*The surge of spirits has passed*");
        }, 1000 * 60 * 10);
      } else {
        started = true;
        let holidayRole = await msg.guild.roles.fetch(snowflakes.roles.Holiday)
        holidayRole.setName("Ghost Hunter")
        holidayRole.setColor(holidays[0].color)
        msg.channel.send({
          embeds: [
            u.embed().setColor(holidays[0].color).setTitle("Special Event").setDescription(holidays[0].description)
          ]
        })
      }
    }
  }
}).setClockwork(() => {
  try {
    return setInterval(() => {
      let guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
      const TargetUSTime = 5; //5 AM is the target MST time. The Devs are MST based, so this was the easiest to remember
      const modifierToConvertToBotTime = 7;
      odds = odds > 20 ? odds - 10 : odds;
      if (moment().hours() == TargetUSTime + modifierToConvertToBotTime) {
        guild.roles.cache.get(snowflakes.roles.Holiday).members.each((m) =>
          u.addRoles(m, snowflakes.roles.Holiday, true)
        )
      }

    }

      , 60 * 60 * 1000);
  } catch (e) { u.errorHandler(e, "cakeOrJoinDay Clockwork Error"); }
})

module.exports = Module;
