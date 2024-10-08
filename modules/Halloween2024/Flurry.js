let Flurry = {
  //TODO: Add Flurry functions

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
  }
};

module.exports = Flurry;