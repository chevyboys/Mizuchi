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
    console.log(`A Flurry has been started in ${channel}!`)
    return true;
  },
  /**
   * Ends a flurry in a channel
   * @param {Channel} channel 
  */
  end: (channel) => {
    console.log(`The Flurry in ${channel} has come to an end!`)
    return true;
  },
  blizzard: {
    /**
     * Starts a blizzard in all channels
     * @param {Channel} channel 
     */
    start: (channel, minutes = 10) => {
      console.log(`A Blizzard has been started in ${channel}!`)
      return true;
    },
    /**
     * Ends a blizzard in all channels
     * @param {Channel} channel 
    */
    end: (channel) => {
      console.log(`The Blizzard in ${channel} has come to an end!`)
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