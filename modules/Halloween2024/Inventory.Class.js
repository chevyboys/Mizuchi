
/**
 * A user's inventory
 */

//TODO: for @chevyboys, integrate this file with the controller
const { Role, Interaction } = require("discord.js");

class Inventory extends Array {
  #_userID;
  constructor() {
    super();
  }

  /**
   * Gets the roles available to the user as an array of snowflakes
   * @returns {Array<string>} An array of snowflakes
   */
  get availableRoles() {
    //Implement this method @SapphireSapphic
  }

  get userID() {
    return this.#_userID;
  }

  //TODO: @SapphireSapphic feel free to add more methods as needed

  /**
   * Converts the inventory to a JSON string
   * @returns {string} The JSON string
   */

  toJSON() {
    return this.map(r => r.toString());
  }

}

module.exports = Inventory;