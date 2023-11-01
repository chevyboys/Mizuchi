const snowflakes = require("../../config/snowflakes.json");
const config = require("../../config/config.json");
const u = require("../../utils/Utils.Generic");
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
let recentReactions = [];
let haunted = [];
let hauntedChannel = null;
let consumed = [];

Module.addEvent("messageReactionAdd", async (reaction, user) => {
  let message = reaction.message;
  let channel = message.guild.channels.cache.get(snowflakes.channels.botSpam);
  if ((reaction.emoji.toString().toLowerCase().indexOf(holidays[0].emoji) > -1) && !user.bot && reaction.users.cache.has(message.client.user.id)) {
    //if the person is haunted, simply remove their reaction and do nothing else. Also skip them if they have gotten one in the last ten seconds
    if (haunted.includes(user.id) || reaction.message.guild.roles.cache.get("1166179561332027522").members.has(user.id) || recentReactions.includes(user.id)) {
      reaction.users.remove(user.id);
      return;
    }


    const member = message.guild.members.cache.get(user.id);
    try {
      const index = cache.findIndex(element => user == element.user);
      if (index != -1) {
        const userCount = cache[index];
        userCount.updateCount();
        channel.send({
          content: `<@${user.id}> found a spirit in <#${message.channel.id}>`,
          allowedMentions: { parse: ["users"] }
        });
        reaction.users.remove(message.client.user.id);
        // incase this is changed later instead of if statments
        switch (userCount.count) {
          case 10:
            //if the user already has the role, don't do anything
            if (member.roles.cache.has(snowflakes.roles.Holiday)) break;
            u.addRoles(member, snowflakes.roles.Holiday);
            channel.send({
              content: `<@${user.id}> has captured enough spirits and has become a <@&${snowflakes.roles.Holiday}> until the next reset (at cakeday announcement time)`,
              allowedMentions: { parse: ["users"] }
            });
            break;
          case 20: channel.send({ embeds: [u.embed().setColor(holidays[0].color).setTitle("Special Event").setDescription(`<@${user.id}> has captured an incredible number of spirits!`)] });
            break;
          case 25:
          case 15: channel.send({
            content: `<@${user.id}> has captured too many spirits! They are now haunted and they won't be able to capture any more spirits for the next few minutes!`,
            allowedMentions: { parse: ["users"] }
          });
            //add user to haunted list, and remove after 5 minutes
            haunted.push(user.id);
            setTimeout(() => {
              haunted.splice(haunted.indexOf(user.id), 1);
            }, 1000 * 60 * 5);
            break;
          case 30: channel.send({ embeds: [u.embed().setColor(holidays[0].color).setTitle("Special Event").setDescription(`<@${user.id}> captured too many spirits and has been consumed!`)] });
            try {
              user.send("You have been consumed by the spirits! You will not be able to capture any more spirits until the next reset (at cakeday announcement time). You have gained the dark powers of the consumed. Once per ten minutes you may react with a ⚫ to summon a ghost on a message of your choice");

            } catch (error) {
              u.errorLog(error, "Holiday DM error");
            }

            u.addRoles(member, "1166179561332027522");
        }

      } else {
        recentReactions.push(user.id);
        setTimeout(() => {
          recentReactions.splice(recentReactions.indexOf(user.id), 1);
        }, 1000 * 10);
        cache.push(new Participant(user));
      }


    } catch (error) { u.errorHandler(error, "Holiday reaction error"); }
  }
  else if (reaction.emoji.toString().toLowerCase().indexOf("🔮") > -1 && config.AdminIds.includes(user.id)) {
    reaction.remove()
    await reaction.message.react(holidays[0].emoji);
  } else if (reaction.emoji.toString().toLowerCase().indexOf("⚫") > -1 && !consumed.includes(user.id) && reaction.message.guild.roles.cache.get("1166179561332027522").members.has(user.id)) {
    reaction.remove()
    reaction.message.react(holidays[0].emoji);
    consumed.push(user.id);
    setTimeout(() => {
      consumed.splice(consumed.indexOf(user.id), 1);
    }, 1000 * 5 * 60);
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
  } else if (hauntedChannel == "*" || msg.channel.id == hauntedChannel) {
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
    } else if (config.AdminIds.includes(msg.author.id) && msg.content.indexOf("💫") > -1) {
      msg.delete();
      if (started) {
        msg.channel.send("*A massive surge of spirits is rising everywhere*");
        hauntedChannel = "*";
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
        guild.roles.cache.get("1166179561332027522").members.each((m) =>
          u.addRoles(m, "1166179561332027522", true)
        )
      }

    }

      , 60 * 60 * 1000);
  } catch (e) { u.errorHandler(e, "cakeOrJoinDay Clockwork Error"); }
})

module.exports = Module;
