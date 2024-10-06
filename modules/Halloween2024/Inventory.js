
/**
 * A user's inventory
 */

const { Role } = require("discord.js");

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

  /**
   * Adds a role to the user's inventory
   * @param {string|Role} role The role, resolved to a snowflake
   * @returns {boolean} True if the role was added, false if the role was already in the inventory
   * @throws {Error} If the role is not available
   */

  addRole(role) {
    //Implement this method @SapphireSapphic
  }

  toJSON() {
    return this.map(r => r.toString());
  }

}

module.exports = Inventory;