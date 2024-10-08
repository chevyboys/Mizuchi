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

  /**
   * Starts a flurry in a channel
   * @param {Channel} channel 
   */
  start: (channel, minutes = 10) => {
    return true;
  },
  /**
   * Ends a flurry in a channel
   * @param {Channel} channel 
  */
  end: (channel) => {
    return true;
  },
  blizzard: {
    /**
     * Starts a blizzard in all channels
     * @param {Channel} channel 
     */
    start: (channel, minutes = 10) => {
      return true;
    },
    /**
     * Ends a blizzard in all channels
     * @param {Channel} channel 
    */
    end: (channel) => {
      return true;
    }
  },
  /**
   * 
   * @param {Message} msg 
   * @returns {boolean} returns true if the message should have a reaction given because of a flurry. This function does not actually add the reaction, nor does it need to check if the message is spam.
   */

  reactBecauseOfFlurry: async (msg) => {
    return false;
  }
};

module.exports = Flurry;