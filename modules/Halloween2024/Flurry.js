const { flush } = require('pm2');
const snowflakes = require('../../config/snowflakes.json');
const { channels } = require('../../utils/Utils.RolesLogin');
let Flurry = {
  //TODO: Add Flurry functions
  //IF flurries should persist between restarts, you will need to do the following:
  //- have a function that creates a file in ../../data/holiday/flurries.json if it does not exist
  //- writes any flurry information to that file
  // and seperately read that file in at startup.

  /**
   * run by the controller each time the bot restarts
   */
  init: () => {
    let flurryChannels = {}
    let flurryBlacklist = [
      snowflakes.channels.ask,
      snowflakes.channels.blogAnnouncements,
      snowflakes.channels.earthTemple,
      snowflakes.channels.general,
      snowflakes.channels.faq,
      snowflakes.channels.introductions,
      snowflakes.channels.kesterBomb,
      snowflakes.channels.modRequests,
      snowflakes.channels.roles,
      snowflakes.channels.rules,
      snowflakes.channels.transfer,
      snowflakes.channels.secret,
      snowflakes.channels.spoilerPolicy,
      "785160606676025384",
      "443461509994119168",
      "823578704512155688",
      "823578762297081887",
      "1146810277539618906",
      "443461671789395970",
      "443461722951385090",
      "703695980897370222"
    ]
    return true;
  },

  flurryCheck: async (msg) => { //Whether or not a flurry should be started on a random message
    let flurryRoll = Math.floor(Math.random() * 1000);
    let flurryChance = 0;
    //let flurryMsgAuthor = msg.author.id
    if (!isSpam(msg)) { //spam check
      let lastTenMsgs = await msg.channel.messages.fetch({ limit: 10 });
      if (lastTenMsgs.some((msg) => msg.createdTimestamp >= (Date.now() - 7200))) {
        //At least one of the last 10 messages was within the last two hours
        flurryChance = 100;
      }
    }
    if (flurryChance > flurryRoll) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * Starts a flurry in a channel
   * @param {Channel} channel 
   */
  start: (channel, minutes = 10) => {
    //Check if channel is #general or book channels
    let idCheck = channel.id
    if (flurryBlacklist.includes(idCheck)) {
      return false;
    } else if (flurryChannels[idCheck].status) { //flurry is currently active
      flurryChannels[idCheck].flurryEnd += (minutes * 60)
      console.log(`The Flurry in ${channel.name} has been extended!`)
    } else {
      flurryChannels.assign(flurryChannels, {
        idCheck: { "status": true, "flurryEnd": Date.now() + (minutes * 60) }
      })
      console.log(`A Flurry has been started in ${channel.name}!`)
    }
    return true;
  },
  /**
   * Ends a flurry in a channel
   * @param {Channel} channel 
  */
  end: (channel) => {
    let idCheck = channel.id
    flurryChannels[idCheck] = { "status": false }
    console.log(`The Flurry in ${channel.name} has come to an end!`)
    return true;
  },
  blizzard: {
    /**
     * Starts a blizzard in all channels
     * @param {Channel} channel 
     */
    start: (channel, minutes = 10) => {
      flurryChannels.entries().forEach(element => {
        if (flurryChannels[element].status) { //flurry is active
          flurryChannels[element].flurryEnd += minutes * 60
        } else {
          flurryChannels[element] = {
            "status": true,
            "flurryEnd": Date.now + (minutes * 60)
          }
        }
      });
      console.log(`A Blizzard has been started in the server!`)
      return true;
    },
    /**
     * Ends a blizzard in all channels
     * @param {Channel} channel 
    */
    end: (channel) => {
      flurryChannels.entries().forEach(element => {
        flurryChannels[element] = { "status": false }
      });
      console.log(`The Blizzard in the server has come to an end!`)
      return true;
    }
  },
  /**
   * 
   * @param {Message} msg 
   * @returns {boolean} returns true if the message should have a reaction given because of a flurry. This function does not actually add the reaction, nor does it need to check if the message is spam.
   */

  reactBecauseOfFlurry: async (msg) => {
    return !isSpam(msg);
  }
};

module.exports = Flurry;
module.exports = flurryChannels;
module.exports = flurryBlacklist;