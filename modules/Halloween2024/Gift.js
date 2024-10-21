/**
 * Gift Module
 * Author: jhat0353
 * Date: 2024
 */

const ParticipantManager = require('./Participant.js');
const Interaction = require('discord.js')
const event = require('./utils');


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

    // find some way to figure out who the target of the slash command is
    let target = null

    // dev override allow self-sending for testing | To be disabled later
    if (event.isAdmin(participants.get(interaction.member))) {
      //
      return true;
    }
    // Be sure to handle the cases where:
    // - the sender is trying to gift themselves
    else if (participants.get(interaction.member) != target) {


      // - the sender is trying to gift someone who has blocked Tavare
      /*if(participants.recipient){
        // I don't know how to figure this out.
      }*/

      // - the sender is trying to gift a worldmaker (this is not allowed)
      if (participants.get(interaction.member).roles.cache.has(snowflakes.roles.WorldMaker)) {

        return false;
      }

      // - the sender is trying to gift someone who has not been active in the last 3 months (if possible to determine)

      // - the sender does not have enough positive emojis to send a gift
      //To determine if someone CAN send a gift, user:
      // - participants.get(interaction.user.id)?.canSendGift 
      // This handles if a user has gotten a Friendly ghost since they last sent a gift. 

      if (participants.get(interaction.member)?.canSendGift) {
        // code to send the message?
        sendGift();

      }


    }





  },

}
module.exports = gift;