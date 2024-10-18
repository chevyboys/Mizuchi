/**
 * Gift Module
 * Author: jhat0353
 * Date: 2024
 */

const ParticipantManager = require('participant.js');
const Interaction = require('discord.js')

function sendGift(interaction, participants) {
  // send a message to the target user


  // 
}


let gift = {
  /**
   * 
   * @param {Interaction} interaction 
   * @param {ParticipantManager} participants 
   */
  command: async (interaction, participants) => {
    //TODO: Implement this function @jhat0353

    // dev override allow self-sending for testing | To be disabled later
    if (isAdmin(participants.get(interaction.user.id))) {
      //
      return true;
    }
    // Be sure to handle the cases where:
    // - the sender is trying to gift themselves
    else if (participants.get(interaction.user.id) != participants.get(interaction.recipient.id)) {


      // - the sender is trying to gift someone who has blocked Tavare
      /*if(participants.recipient){
        // I don't know how to figure this out.
      }*/

      // - the sender is trying to gift a worldmaker (this is not allowed)
      if (participants.get(interaction.recipient.id).roles.cache.has(1294112406816952361)) {

        return false;
      }

      // - the sender is trying to gift someone who has not been active in the last 3 months (if possible to determine)

      // - the sender does not have enough positive emojis to send a gift
      //To determine if someone CAN send a gift, user:
      // - participants.get(interaction.user.id)?.canSendGift 
      // This handles if a user has gotten a Friendly ghost since they last sent a gift. 

      if (participants.get(interaction.user.id)?.canSendGift) {
        // code to send the message?


      }


    }





  },

}
module.exports = gift;