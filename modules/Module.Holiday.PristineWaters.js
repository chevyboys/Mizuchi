//Initalization, imports, etc
const { Guild, Role, Message, MessageReaction, User, GuildMember } = require('discord.js');
const snowflakes = require('../config/snowflakes.json')
const Module = new (require("augurbot")).Module;
const fs = require('fs');
const webhookSend = require('../utils/Webhook.js');
const config = require('../config/config.json');
const u = require('../utils/Utils.Generic');


let odds = 3;
const eventAvatar = "./avatar/winter.png";
const firstDayOfHanukkah = "12/07";

const eventEmoji = [
  "💧",
  "❄"
]

const eventColors = [
  {
    name: "Bingus Blurple",
    color: "#c4ccff"
  },
  {
    name: "Blue",
    color: "#8CD2FF"
  },
  {
    color: "#DBA3FF",
    name: "Lavender",
  },
  {
    color: "#FFD28C",
    name: "Gold"
  },
  {
    color: "#A10000",
    name: "Deep Red"
  },
  {
    name: "Green",
    color: "#009D4C"
  },
]


function NPCSend(channel, embedOptions, additionalMessageOptions) {
  embedOptions.color = eventColors[0].color;
  additionalMessageOptions.embeds = [embedOptions];
  return webhookSend.webhook(channel, "Archduke Soju Ryotsu", eventRoles[0].icon, additionalMessageOptions);
}

const eventRoles = [{
  name: "Seeker of Pristine Water",
  color: eventColors.find(c => c.name == "Bingus Blurple").color,
  hoist: true,
  icon: "./avatar/blueStar.png"
},
{
  name: "Celebrant",
  color: eventColors.find(c => c.name == "Gold").color,
  hoist: true,
  icon: "./avatar/blueStar.png" //TODO: CHANGE THIS
}
];


const eventColorRoles = [];
class Participant {
  #_user;
  #_count = 1;
  #_MultiDayCount = 0;
  #_currency = 0;
  #_MultiDayGifted = 0;
  #_MultiDayReceived = 0;
  #_gifted = 0;
  #_received = 0;
  #_status = "ACTIVE" // ACTIVE, BANNED, SUSPENDED, INACTIVE
  #_lastSuspension = 0;

  constructor({ user, count = 1, MultiDayCount = 0, currency = 0, gifted = 0, received = 0, multiDayGifted = 0, multiDayReceived = 0 }) {
    try {
      this.#_user = user.id ? user.id : user;
    } catch (error) {
      if (error.message.indexOf("Cannot read properties of undefined") > -1) {
        return;
      } else throw error;
    }
    this.#_MultiDayCount = MultiDayCount;
    this.#_count = count;
    this.#_currency = currency;
    this.#_gifted = gifted;
    this.#_received = received;
    this.#_MultiDayGifted = multiDayGifted;
    this.#_MultiDayReceived = multiDayReceived;
  }

  async updateCount() {
    this.#_count++;
    //if the count is ten higher than last suspension, have a 10% chance of suspending the user, increasing by 1% for every count above the last suspension. unsuspend the user after 5 minutes
    if (this.#_count > this.#_lastSuspension + 10) {
      if (Math.random() * 100 < (this.#_count - this.#_lastSuspension) / 10) {
        this.#_status = "SUSPENDED";
        this.#_lastSuspension = this.#_count;
        setTimeout(() => {
          this.#_status = "ACTIVE";
        }, 5 * 60 * 1000);
      }
    }
    await this.#_rewards();
    return this.#_status;
  }

  async updateReceived() {
    this.#_received++;
    await this.#_rewards();
  }

  updateGifted() {
    this.#_gifted++;
    //await rewards();
  }

  async #_rewards() {
    let guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
    let member = guild.members.cache.get(this.user);
    let channel = guild.channels.cache.get(snowflakes.channels.botSpam);
    switch (this.adjustedCount) {
      case 5:
        if (!eventRoles[0].role) await generateRoles(guild);
        if (member.roles.cache.has(eventRoles[0].role.id)) return;
        member.roles.add(eventRoles[0].role);
        NPCSend(channel, u.embed(
          {
            description: `I'm proud to say that <@${this.user}>, a <@&${eventRoles[0].role.id}>, has enough pristine water to begin their journey. They have gained access to the /event command. \nContinue gathering water to grow in strength and unlock more secrets.`,
          }
        ),
          {
            content: `<@${this.user}>`,
            allowedMentions: { users: [this.user] }
          }
        );
        break;

    }
  }

  get count() {
    return this.#_count;
  }

  get user() {
    return this.#_user;
  }

  get MultiDayCount() {
    return this.#_MultiDayCount;
  }

  get adjustedCount() {
    return this.#_count + this.received - this.gifted;
  }

  get gifted() {
    return this.#_gifted;
  }

  get received() {
    return this.#_received;
  }

  get currency() {
    return this.#_currency;
  }

  get MultiDayGifted() {
    return this.#_MultiDayGifted;
  }

  get MultiDayReceived() {
    return this.#_MultiDayReceived;
  }

  get status() {
    return this.#_status;
  }

  dailyReset() {
    this.#_MultiDayCount += this.#_count;
    this.#_count = 0;
    this.#_MultiDayGifted += this.#_gifted;
    this.#_MultiDayReceived += this.#_received;
    this.#_gifted = 0;
    this.#_received = 0;
  }

  getWriteable() {
    return {
      user: this.#_user,
      count: this.#_count,
      MultiDayCount: this.#_MultiDayCount,
      currency: this.#_currency,
      gifted: this.#_gifted,
      received: this.#_received,
      multiDayGifted: this.#_MultiDayGifted,
      multiDayReceived: this.#_MultiDayReceived
    };
  }

}

const cacheFilePath = './data/holiday/cache.json';

let cache = [];
function cacheWrite() {
  fs.writeFileSync(cacheFilePath, JSON.stringify(cache.map(element => element.getWriteable()), 0, 4));

}
if (fs.existsSync(cacheFilePath)) {
  cache = require("." + cacheFilePath).map(element => new Participant(element));
} else {
  cacheWrite();
}

/**
 * 
 * @param {Snowflake} giver 
 * @param {Snowflake} reciever 
 * @returns {boolean} true if the transaction is permitted, false if there is insufficient funds
 */
async function participantGift(giver, reciever) {
  let giverIndex = cache.findIndex(element => giver == element.user);
  let recieverIndex = cache.findIndex(element => reciever == element.user);
  if (giverIndex == -1) {
    cache.push(new Participant({ user: giver, count: 0, MultiDayCount: 0, currency: 0, gifted: 0, received: 0, multiDayGifted: 0, multiDayReceived: 0 }));
    giverIndex = cache.length - 1;
    cacheWrite();
    return false;
  }
  if (recieverIndex == -1) {
    cache.push(new Participant({ user: reciever, count: 0, MultiDayCount: 0, currency: 0, gifted: 0, received: 0, multiDayGifted: 0, multiDayReceived: 0 }));
    recieverIndex = cache.length - 1;
  }
  if (giverIndex == recieverIndex) return true;
  if (cache[giverIndex].adjustedCount > 0) {
    cache[giverIndex].updateGifted();
    await cache[recieverIndex].updateReceived();
    cacheWrite();
    return true;
  } else {
    cacheWrite();
    return false;
  }
}




//get random emoji from eventEmoji
function getRandomEmoji() {
  return eventEmoji[Math.floor(Math.random() * eventEmoji.length)];
}

//Event opening
//create the needed roles, if roles of their name don't exist.
//generate color roles
//for each event color, create a role with that color titled "pristine waters <color name> if that role doesn't exist" This should be done in the generateRoles async function

/**
 * 
 * @param {Guild} guild 
 */
async function generateRoles(guild) {
  let promises = [];
  console.log("Generating roles");
  for (const color of eventColors) {
    let role = guild.roles.cache.find(r => r.name.toLowerCase() == `pristine ${color.name.toLowerCase()}`);

    if (!role) {
      role = await guild.roles.create({
        name: `Pristine ${color.name}`,
        color: color.color,
        reason: "Pristine Waters Event",
        position: guild.roles.cache.get(snowflakes.roles.Holiday[0]).position - 1
      });
      console.log("Created " + role.name + " role");
    } else {
      console.log("Found " + role.name + " role");
    }
    eventColorRoles.push(role);
  }

  //update the bonus xp roles we already have
  //sort snowflakes.roles.Holiday by position
  let holidayRoles = snowflakes.roles.Holiday.sort((a, b) => guild.roles.cache.get(a).position - guild.roles.cache.get(b).position);
  for (const role of holidayRoles) {
    if (guild.premiumTier != "TIER_2" && guild.premiumTier != "TIER_3") {
      eventRoles[holidayRoles.indexOf(role)].icon = undefined;
    }
    promises.push(guild.roles.edit(role, eventRoles[holidayRoles.indexOf(role)]).then(discordRole => {
      eventRoles[snowflakes.roles.Holiday.indexOf(role)].role = discordRole;
      console.log("Updated " + discordRole.name + " role");
    }
    ));

  }
  return await Promise.all(promises);
}
/**
 * 
 * @param {Guild} guild 
 * @returns 
 */
async function cleanRoles(guild) {
  let promises = [];
  console.log("Cleaning roles");

  for (const color of eventColors) {
    const role = guild.roles.cache.find(r => r.name.toLowerCase() == `pristine ${color.name.toLowerCase()}`);
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
            return cleanRoleMembers(discordRole);
          }
          )
      )
      );
    }
    return Promise.all(promisesRoles);
  }
  ));

  return await Promise.all(promises);
}

function cleanRoleMembers(role) {
  let removalPromises = [];
  role.members.forEach(m => {
    removalPromises.push(m.roles.remove(role));
  }
  )

  return Promise.all(removalPromises);
}

/**
 * 
 * @param {Message} msg 
 */
function setHolidayBotIcon() {
  return Module.client.user.setAvatar(eventAvatar || ('./avatar/' + ("base.png")))
}

function cleanHolidayBotIcon() {
  return Module.client.user.setAvatar(('./avatar/' + ("base.png")))
}



Module.addEvent("messageReactionAdd",
  /**
   * 
   * @param {MessageReaction} reaction 
   * @param {User} user 
   */
  async (reaction, user) => {
    let message = reaction.message;
    let channel = message.guild.channels.cache.get(snowflakes.channels.botSpam);
    if (eventEmoji.indexOf(reaction.emoji.toString().toLowerCase()) > -1 && !user.bot && reaction.users.cache.has(message.client.user.id)) {
      /**
       * @param {GuildMember} member
       */
      const member = message.guild.members.cache.get(user.id);
      let status;
      try {
        const index = cache.findIndex(element => user == element.user);
        if (cache[index].status != "ACTIVE") {
          reaction.users.remove(cache[index].user);
          return;
        }
        if (index != -1) {
          const userCount = cache[index];
          status = await userCount.updateCount();

        } else {
          cache.push(new Participant({ user: user }));
        }
        NPCSend(channel,
          u.embed(
            {
              description: `I see <@${user.id}> found pristine water in <#${message.channel.id}> `,
              footer: {
                text: `Found today: ${cache[index].adjustedCount} | total: ${cache[index].MultiDayCount + cache[index].count}\nGifted today: ${cache[index].gifted} | total: ${cache[index].MultiDayGifted + cache[index].gifted}\nReceived today: ${cache[index].received} | total: ${cache[index].MultiDayReceived + cache[index].received}`
              }
            }
          ),
          {
            content: `<@${user.id}>`,
            allowedMentions: { users: [user.id] }
          }
        );
        if (status == "SUSPENDED") {
          NPCSend(channel,
            u.embed(
              {
                description: `<@${user.id}> is carrying to much and needs to rest for a few minutes.`,
                footer: {
                  text: `Found today: ${cache[index].adjustedCount} | total: ${cache[index].MultiDayCount + cache[index].count}\nGifted today: ${cache[index].gifted} | total: ${cache[index].MultiDayGifted + cache[index].gifted}\nReceived today: ${cache[index].received} | total: ${cache[index].MultiDayReceived + cache[index].received}`
                }
              }
            ),
            {
              content: `<@${user.id}>`,
              allowedMentions: { users: [user.id] }
            }
          );
        }
        // Write cache to a JSON file
        cacheWrite();


        reaction.users.remove(message.client.user.id);
      } catch (error) { u.errorHandler(error, "Holiday reaction error"); }
    }
    else if (reaction.emoji.toString().toLowerCase().indexOf("🔮") > -1 && config.AdminIds.includes(user.id)) {
      reaction.remove()
      await reaction.message.react(getRandomEmoji());
    }
  }).addEvent("messageCreate", async (msg) => {
    if (
      msg.author &&
      !msg.webhookId &&
      !msg.author.bot &&
      (msg.member.roles.cache.has(snowflakes.roles.Holiday[1]) ? (Math.random() * 100 < odds) : (Math.random() * 100 < odds + 5))
    ) {
      msg.react(getRandomEmoji());
    }
  }).setClockwork(() => {
    try {
      return setInterval(async () => {
        let guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
        const TargetUSTime = 5; //5 AM is the target MST time. The Devs are MST based, so this was the easiest to remember
        const modifierToConvertToBotTime = 7;
        if (moment().hours() == TargetUSTime + modifierToConvertToBotTime) {
          let roles = guild.roles.cache.get(snowflakes.roles.Holiday);
          await cleanRoleMembers(roles[0]);
          await cleanRoleMembers(roles[1]);
          cache.forEach(element => {
            element.dailyReset();
          });
        }
        cacheWrite();
      }

        , 60 * 60 * 1000);
    } catch (e) { u.errorHandler(e, "event Clockwork Error"); }
  })




Module.addCommand({//TODO: REMOVE THIS
  name: "prep",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: (msg) => true,
  process: async (msg) => {
    await generateRoles(msg.guild);
    await msg.channel.send("Roles generated");
  }
}).addCommand({ //TODO: REMOVE THIS
  name: "begin",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: (msg) => true,
  process: async (msg) => {
    await setHolidayBotIcon(msg);
    await msg.react("✔");
  }
}).addCommand({ //TODO: REMOVE THIS
  name: "clean",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: (msg) => true,
  process: async (msg) => {
    await cleanRoles(msg.guild);
    await cleanHolidayBotIcon(msg);
    await msg.channel.send("Roles cleaned");
  }
}).addCommand({ //TODO: REMOVE THIS
  name: "gift",
  guild: snowflakes.guilds.PrimaryServer,
  permissions: () => true,
  process: async (msg) => {
    let user = msg.mentions.users.first();
    if ((await participantGift(msg.author.id, user)) !== false) {
      msg.channel.send("Transaction successful");
    }
    else {
      msg.channel.send("You require more funds");
    }

  }
})


  //NPC introduction


  //Send messages from characters


  //allow people to gain event currency


  //reward people for event currency
  //role inventory commands

  //allow people to grant gifts

  //allow people to create storms



  //admin commands
  //allow people to get stats on how many people have done each thing
  //allow admins to add an emoji



  //Hannukah
  .setClockwork(() => {
    try {
      return setInterval(() => {
        //if today is the first day of hannukah, change the bot's avatar to Hanukkah1.png avatar
        //if today is the second day of hannukah, change the bot's avatar to Hanukkah2.png avatar
        //if today is the third day of hannukah, change the bot's avatar to Hanukkah3.png avatar
        //if today is the fourth day of hannukah, change the bot's avatar to Hanukkah4.png avatar
        //if today is the fifth day of hannukah, change the bot's avatar to Hanukkah5.png avatar
        //if today is the sixth day of hannukah, change the bot's avatar to Hanukkah6.png avatar
        //if today is the seventh day of hannukah, change the bot's avatar to Hanukkah7.png avatar
        //if today is the eighth day of hannukah, change the bot's avatar to Hanukkah8.png avatar

        if (moment().format("MM/DD") == firstDayOfHanukkah) {
          Module.client.user.setAvatar(('./avatar/' + ("Hanukkah1.png")))
        }
        else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(1, "day").format("MM/DD")) {
          Module.client.user.setAvatar(('./avatar/' + ("Hanukkah2.png")))
        }
        else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(2, "day").format("MM/DD")) {
          Module.client.user.setAvatar(('./avatar/' + ("Hanukkah3.png")))
        }
        else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(3, "day").format("MM/DD")) {
          Module.client.user.setAvatar(('./avatar/' + ("Hanukkah4.png")))
        }
        else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(4, "day").format("MM/DD")) {
          Module.client.user.setAvatar(('./avatar/' + ("Hanukkah5.png")))
        }
        else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(5, "day").format("MM/DD")) {
          Module.client.user.setAvatar(('./avatar/' + ("Hanukkah6.png")))
        }
        else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(6, "day").format("MM/DD")) {
          Module.client.user.setAvatar(('./avatar/' + ("Hanukkah7.png")))
        }
        else if (moment().format("MM/DD") == moment(firstDayOfHanukkah).add(7, "day").format("MM/DD")) {
          Module.client.user.setAvatar(('./avatar/' + ("Hanukkah8.png")))
        } else
          //if the month is december, set the bot's avatar to winter.png
          if (moment().format("MM") == "12") {
            Module.client.user.setAvatar(eventAvatar || ('./avatar/' + ("winter.png")))
          }

      }, 3 * 60 * 60 * 1000);
    } catch (e) { u.errorHandler(e, "Hannukah PFP update error"); }
  })


module.exports = Module;