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





Module.addEvent("messageReactionAdd", async (reaction, user) => {
  let message = reaction.message;
  let channel = message.guild.channels.cache.get(snowflakes.channels.botSpam);
  if ((reaction.emoji.toString().toLowerCase().indexOf(holidays[0].emoji) > -1) && !user.bot && reaction.users.cache.has(message.client.user.id)) {

    const member = message.guild.members.cache.get(user.id);
    try {
      const index = cache.findIndex(element => user == element.user);
      if (index != -1) {
        const userCount = cache[index];
        userCount.updateCount();
        // incase this is changed later instead of if statments
        switch (userCount.count) {
          case 5:
            u.addRoles(member, snowflakes.roles.Holiday);
            channel.send({
              content: `<@${user.id}> has captured enough spirits and has become a <@&${snowflakes.roles.Holiday}> until the next reset (at cakeday announcement time)`,
              allowedMentions: { parse: ["users"] }
            });
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
    (msg.member.roles.cache.has(snowflakes.roles.Holiday) ? (Math.floor(Math.random() * odds / 2) > odds / 2 - 2) : (Math.floor(Math.random() * odds) > odds - 2))
  ) {
    msg.react(holidays[0].emoji)
  }
  else {
    if (config.AdminIds.includes(msg.author.id) && msg.content.indexOf("🔮") > -1 && !started) {
      started = true;
      msg.delete();
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
