const snowflakes = require("../config/snowflakes.json");
const config = require("../config/config.json");
const u = require("../utils/Utils.Generic");
const Augur = require("augurbot");
const Module = new Augur.Module;
const moment = require("moment");
let odds = 500;
let started = false;
const holidays = [
  {
    name: 'Generic Event',
    description: "If you are reading this, you have found the first secret. Do not speak of this thing. Keep it secret. Keep it safe. The hunt continues...",
    emoji: "",
    color: "#000e29",
    emoji2: "🦅"

  }
]

// on server shutdown this cache should be written to database and also be cleared at the end of event (with database clear too)
let cache = [];
class Participant {
  #_user;
  #_count = 1;
  #_count2 = 0;

  constructor(user) {
    this.#_user = user?.id ? user.id : user;
  }

  updateCount() {
    this.#_count++;
  }

  updateCount2() {
    this.#_count2++;
  }

  get count2() {
    return this.#_count2;
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
            u.addRoles(member, snowflakes.roles.Holiday[0]);
            member.send({
              content: `If you are reading this, you have found the first secret. Do not speak of this thing. Keep it secret. Keep it safe. The hunt continues...`,
              allowedMentions: { parse: ["users"] }
            });
            break;
          case 25:
            member.send({
              content: `it grows nearer. The hunt continues...`,
              allowedMentions: { parse: ["users"] }
            });
            break;
          case 50:
            member.send({
              content: `Watch for the sign of the eagle in the days to come. The hunt continues...`,
              allowedMentions: { parse: ["users"] }
            });
            break;

        }

      } else {
        cache.push(new Participant(user));
      }
      //react with 👀, then wait five seconds before making the eyes dissapear
      reaction.users.remove(message.client.user.id);
      message.react('👀');
      await new Promise(resolve => setTimeout(resolve, 5000));
      message.reactions.cache.get('👀').remove();
      reaction.users.remove(message.client.user.id);

    } catch (error) { u.errorHandler(error, "Secret reaction error"); }
  }
  else if (reaction.emoji.toString().toLowerCase().indexOf("🔮") > -1 && config.AdminIds.includes(user.id)) {
    reaction.remove()
    await reaction.message.react(holidays[0].emoji);
  } else if ((reaction.emoji.toString().toLowerCase().indexOf(holidays[0].emoji2) > -1) && !user.bot && reaction.users.cache.has(message.client.user.id)) {

    try {
      const index = cache.findIndex(element => user == element.user);
      if (index != -1) {
        const userCount = cache[index];
        if (userCount.count < 50) {
          reaction.users.remove(user.id);
          return;
        }
        const member = message.guild.members.cache.get(user.id);
        userCount.updateCount2();
        // incase this is changed later instead of if statments
        switch (userCount.count) {
          case 5:
            u.addRoles(member, snowflakes.roles.Holiday[0]);
            member.send({
              content: `The creature has been spotted. Be wary. The hunt continues...`,
              allowedMentions: { parse: ["users"] }
            });
            break;
          case 25:
            member.send({
              content: `A single key for 50, to oppose tyranny, a champion of the helpless. The likely reward.`,
              allowedMentions: { parse: ["users"] }
            });
            break;
          case 50:
            member.send({
              content: `Slqpyzle jezos fmxkj qoo, bpx srik jjkvyoic svpeeeje`,
              allowedMentions: { parse: ["users"] }
            });
            break;
          case 100:
            console.log({
              content: `Lfqhl grajcfh tifr tc rdbbq tay pxzqbpv. Qqpyqugfe fwla bsl fqgl kvjd emxu mbs fm dtdoeb. Lfq davrp hydiz cs rzc oabsf  aslzda pr dgszs osec.`,
              allowedMentions: { parse: ["users"] }
            });
            break;
          case 66:
            member.send({
              content: `Lcxa dmqb lfq zlm, gfw ypsysfq szakl, huc hjmrl kucjc swvgg fabqh avr bgagblbgq. xgzs avrpw rtt ncnj, lfq ivcy cncziboyjq.`,
              allowedMentions: { parse: ["users"] }
            });
            break;

        }

      } else {
        cache.push(new Participant(user));
      }
      //react with 👀, then wait five seconds before making the eyes dissapear
      reaction.users.remove(message.client.user.id);
      message.react('👀');
      await new Promise(resolve => setTimeout(resolve, 5000));
      message.reactions.cache.get('👀').remove();
      reaction.users.remove(message.client.user.id);

    } catch (error) { u.errorHandler(error, "Secret reaction error"); }
  }
}).addEvent("messageCreate", async (msg) => {
  if (
    started &&
    msg.author &&
    !msg.webhookId &&
    !msg.author.bot &&
    (msg.member.roles.cache.has(snowflakes.roles.Holiday[0]) ? (Math.floor(Math.random() * odds / 2) > odds / 2 - 2) : (Math.floor(Math.random() * odds) > odds - 2))
  ) {
    msg.react(holidays[0].emoji)
  } else if (
    started &&
    msg.author &&
    !msg.webhookId &&
    !msg.author.bot &&
    (msg.member.roles.cache.has(snowflakes.roles.Holiday[0]) ? (Math.floor(Math.random() * odds * 2 / 2) > odds * 2 / 2 - 2) : (Math.floor(Math.random() * odds * 2) > odds * 2 - 2))
  ) {
    msg.react(holidays[0].emoji2);
  }
  else {
    if ((config.AdminIds.includes(msg.author.id) || msg.member?.roles.cache.has(snowflakes.roles.BotMaster)) && msg.content.indexOf("🔮") > -1 && !started) {
      started = true;
      msg.delete();
      let holidayRole = await msg.guild.roles.fetch(snowflakes.roles.Holiday[0])
      holidayRole.setName("Found")
      holidayRole.setColor(holidays[0].color)
      msg.channel.send({
        embeds: [
          u.embed().setColor(holidays[0].color).setTitle("Log message 1").setDescription(holidays[0].description)
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
      odds = odds < 1000 ? odds + 50 : odds;
      if (moment().hours() == TargetUSTime + modifierToConvertToBotTime) {
        guild.roles.cache.get(snowflakes.roles.Holiday[0]).members.each((m) =>
          u.addRoles(m, snowflakes.roles.Holiday[0], true)
        )
      }

    }

      , 60 * 60 * 1000);
  } catch (e) { u.errorHandler(e, "Secret Clockwork Error"); }
}).addEvent("ready", () => {
  if (holidays[0].emoji == "") {
    holidays[0].emoji = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).emojis.cache.find(emoji => emoji.name === "BotIcon")
  }
});

module.exports = Module;
