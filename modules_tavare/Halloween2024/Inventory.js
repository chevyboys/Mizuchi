const { SelectMenuInteraction } = require('discord.js');
const Inventory = require('./Inventory.Class.js');
const event = require('./utils.js');
const ParticipantManager = require('./Participant.js');

const inventoryHelper = {
  /**
   * 
   * @param {Interaction} interaction 
   * @param {ParticipantManager} participants 
   */
  command: async (interaction, participants) => {
    //TODO: Implement this function @SapphireSapphic
    //the event object should have some things for the various roles we will create.
    //Please populate the colors object in the utils file with appropriate colors and names for the roles so @chevyboys can generate the roles and clean them up.

  },
  /**
   * 
   * @param {SelectMenuInteraction} interaction 
   * @param {ParticipantManager} participants 
   */
  dropdown: async (interaction, participants) => {

  }
}
module.exports = inventoryHelper;