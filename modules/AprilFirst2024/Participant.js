const { Guild, Role, Message, MessageReaction, User, GuildMember } = require('discord.js');
const snowflakes = require('../../config/snowflakes.json')
const fs = require('fs');
const u = require('../../utils/Utils.Generic');
const event = require("./utils");
const NPCSend = require("./NPC");


const suspensionOddsMultiplier = 2;



/**
 * Represents a participant in the Spooky Waters module.
 * @class
 * @property {string} user - The user ID of the participant.
 * @property {number} count - The count of the participant.
 * @property {number} MultiDayCount - The multi-day count of the participant.
 * @property {number} currency - The currency of the participant.
 * @property {number} gifted - The number of gifts given by the participant.
 * @property {number} received - The number of gifts received by the participant.
 * @property {number} multiDayGifted - The multi-day gifts given by the participant.
 * @property {number} multiDayReceived - The multi-day gifts received by the participant.
 * @property {string} status - The status of the participant.
 * @property {number} lastSuspension - The last time the participant was suspended.
 * @property {number} lastAbilityUse - The last time the participant used an ability.
 * @property {number} adjustedCount - The adjusted count of the participant.
 * @property {boolean} canUseAbility - Whether the participant can use an ability right now.
 */
class Participant {
  /**
   * Creates a new Participant instance.
   * @constructor
   * @param {Object} options - The options for the participant.
   * @param {User|string} options.user - The user ID or User object of the participant.
   * @param {number} [options.count=1] - The count of the participant.
   * @param {number} [options.MultiDayCount=0] - The multi-day count of the participant.
   * @param {number} [options.currency=0] - The currency of the participant.
   * @param {number} [options.gifted=0] - The number of gifts given by the participant.
   * @param {number} [options.received=0] - The number of gifts received by the participant.
   * @param {number} [options.multiDayGifted=0] - The multi-day gifts given by the participant.
   * @param {number} [options.multiDayReceived=0] - The multi-day gifts received by the participant.
   * @returns {Participant} The new Participant instance.
   */
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
  #_lastAbilityUse = Date.now() - 1000 * 60 * 60 * 24;

  constructor({ user, count = 1, MultiDayCount = 0, currency = 0, gifted = 0, received = 0, multiDayGifted = 0, multiDayReceived = 0, unlockedColors = [], status = "ACTIVE", lastSuspension = 0, lastAbilityUse = Date.now() - 1000 * 60 * 60 * 24 }) {
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
    this.#_status = (status == "SUSPENDED") ? "ACTIVE" : status;
    this.#_lastSuspension = lastSuspension;
    this.#_lastAbilityUse = lastAbilityUse;
  }

  updateAbilityUse() {
    this.#_lastAbilityUse = Date.now();
  }

  canUseAbility(cooldown = 10) {
    //minutes
    return true;
  }

  async updateCount(client) {
    this.#_count++;

    //if the count is ten higher than last suspension, have a 10% chance of suspending the user, increasing by 2% (or whatever the suspension odds multiplier is) for every count above the last suspension. unsuspend the user after 5 minutes
    /*if (this.#_count > this.#_lastSuspension + 10 && this.#_status != "SUSPENDED" && this.#_status != "INACTIVE") {
      if (Math.random() * 100 < (this.#_count * suspensionOddsMultiplier - this.#_lastSuspension)) {
      let temp = this.#_status;
        this.#_status = "SUSPENDED";
        this.#_lastSuspension = this.#_count;
        setTimeout(() => {
          this.#_status = temp;
        }, 5 * 60 * 1000);
      }
    }*/
    await this.#_rewards(client);
    return this.#_status;
  }

  async updateReceived(client) {
    this.#_received++;
    await this.#_rewards(client);
  }

  updateGifted(client) {
    this.#_gifted++;
    //await rewards();
  }

  /**
   * Handles the rewards for the participant based on their adjusted count.
   * @private
   * @returns {Promise<void>}
   */
  async #_rewards(client) {
    let guild = client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
    let member = guild.members.cache.get(this.user);
    let channel = guild.channels.cache.get(snowflakes.channels.botSpam);

    //if the user has just hit an award threshold, give them the role
    let justUnlocked = event.colors.find(c => c.award_threshold == this.multidayAdjustedCount + this.adjustedCount);
    if (justUnlocked) {
      let colorRole = guild.roles.cache.find(r => r.name.toLowerCase() == ("spooky " + justUnlocked.name).toLowerCase());
      if (!colorRole) {
        await event.generateRoles(guild).then(() => {
          colorRole = guild.roles.cache.find(r => r.name.toLowerCase() == ("spooky " + justUnlocked.name).toLowerCase());
          if (!colorRole) throw new Error("Could not find role " + "Spooky " + justUnlocked.name.toLowerCase());
          NPCSend(channel, u.embed(
            {
              description: `<@${this.user}>, has unlocked the <@&${colorRole.id}> role. Use /halloween inventory to manage your roles.`,
            }
          ),
            {
              content: `<@${this.user}>`,
              allowedMentions: { users: [this.user] }
            }
          );
          return colorRole;
        }).then(colorRole => {
          return member.roles.add(colorRole);
        });
      } else {
        NPCSend(channel, u.embed(
          {
            description: `<@${this.user}>, has unlocked the <@&${colorRole.id}> role. Use /halloween inventory to manage your roles.`,
          }
        ),
          {
            content: `<@${this.user}>`,
            allowedMentions: { users: [this.user] }
          }
        );
        return await member.roles.add(colorRole);
      }
    }


    if (this.adjustedCount > 500 && !this.#_status === "INACTIVE") {
      this.#_status = "INACTIVE";
      this.lastAbilityUse = Date.now() - 1000 * 60 * 60 * 24;
      throw new Error("Participant <@" + this.#_user + "> has reached the maximum count for the event without recieving the inactive status");
    }
    switch (this.adjustedCount) {
      case 5:
        if (!event.roles[0].role) await event.generateRoles(guild);
        if (member.roles.cache.has(event.roles[0].role.id)) return;
        member.roles.add(event.roles[0].role);
        NPCSend(channel, u.embed(
          {
            description: `<@${this.user}>, has been awarded the <@&${event.roles[0].role.id}> role. Keep hunting down spirits and secrets across the server`,
          }
        ),
          {
            content: `<@${this.user}>`,
            allowedMentions: { users: [this.user] }
          }
        );
        break;
      case 504:
      case 503:
      case 502:
      case 501: if (!event.roles[1].role) {
        await event.generateRoles(guild);
      }
        if (member.roles.cache.has(event.roles[1].role.id)) { break }
      case 500: if (!event.roles[1].role) {
        await event.generateRoles(guild);
      }
        await member.roles.add(event.roles[1].role);
        this.#_status = "INACTIVE";
        this.lastAbilityUse = Date.now() - 1000 * 60 * 60 * 24;
        await NPCSend(channel, u.embed(
          {
            description: `<@${this.user}> has fallen to the darkness.`,
          }
        ),
          {
            content: `<@${this.user}>`,
            allowedMentions: { users: [this.user] }
          }
        );
        guild.members.cache.get(this.user).send({
          embeds: [u.embed(
            {
              description: `You've unlocked the ability to use the 😈 emoji every few minutes to hide something spooky somewhere, or you can use the ✨ emoji a few hours after you last used a super powered emoji to trigger a flurry of spirits.`,
            }
          )],
          content: `<@${this.user}>`,
        });
        //send a message in event.channel
        try {
          client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.cache.get(event.channel).send("Welcome to the hidden event channel <@" + this.user + ">!");
        } catch (error) {
        }
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

  get multidayAdjustedCount() {
    return this.#_MultiDayCount + this.#_MultiDayReceived - this.#_MultiDayGifted;
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

  get unlockedColors() {
    return event.colors.filter(c => this.multidayAdjustedCount + this.adjustedCount >= c.award_threshold);
  }

  getunlockedColorRoles(client) {
    if (this.unlockedColors.length < 1) return;
    if (event.roles.length < event.colors.length) {
      return event.generateRoles(client.guilds.cache.get(snowflakes.guilds.PrimaryServer)).then(() => {
        return event.roles.filter(r => r.name.toLowerCase().indexOf("spooky") > -1 && this.unlockedColors.find(c => c.name.toLowerCase() === r.name.toLowerCase().replace("spooky ", "")));
      });
    }
    return event.roles.filter(r => r.name.toLowerCase().indexOf("spooky") > -1 && this.unlockedColors.find(c => c.name.toLowerCase() === r.name.toLowerCase().replace("spooky ", "")));
  }

  dailyReset() {
    this.#_MultiDayCount += this.#_count;
    this.#_count = 0;
    this.#_MultiDayGifted += this.#_gifted;
    this.#_MultiDayReceived += this.#_received;
    this.#_gifted = 0;
    this.#_received = 0;
    this.#_status = "ACTIVE";
    this.lastAbilityUse = Date.now() - 1000 * 60 * 60 * 24;
    this.#_lastSuspension = 0;
  }

  async getWriteable(guild) {
    return {
      user: this.#_user,
      name: guild ? await guild.members.fetch(this.#_user)?.displayName : undefined,
      count: this.#_count,
      MultiDayCount: this.#_MultiDayCount,
      currency: this.#_currency,
      gifted: this.#_gifted,
      received: this.#_received,
      multiDayGifted: this.#_MultiDayGifted,
      multiDayReceived: this.#_MultiDayReceived,
      status: this.#_status,
      lastSuspension: this.#_lastSuspension,
      //lastAbilityUse: this.#_lastAbilityUse,
    };
  }

}

module.exports = Participant;