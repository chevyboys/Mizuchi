/**
 * Gift Module
 * Author: jhat0353
 * Date: 2024
 */

let gift = {
  /**
   * 
   * @param {Interaction} interaction 
   * @param {ParticipantManager} participants 
   */
  command: async (interaction, participants) => {
    //TODO: Implement this function @jhat0353
    // Be sure to handle the cases where:
    // - the sender is trying to gift themselves
    // - the sender is trying to gift someone who has blocked Tavare
    // - the sender is trying to gift a worldmaker (this is not allowed)
    // - the sender is trying to gift someone who has not been active in the last 3 months (if possible to determine)
    // - the sender does not have enough positive emojis to send a gift

    //To determine if someone CAN send a gift, user:
    // - participants.get(interaction.user.id)?.canSendGift 
    // This handles if a user has gotten a Friendly ghost since they last sent a gift. 
  },

}
module.exports = gift;