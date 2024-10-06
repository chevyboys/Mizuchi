
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

  /**
   * Adds a role to the user's inventory
   * @param {string|Role} role The role, resolved to a snowflake
   * @returns {boolean} True if the role was added, false if the role was already in the inventory
   * @throws {Error} If the role is not available
   */

  addRole(role) {
    //Implement this method @SapphireSapphic
  }


  /**
   * replies to the user with their inventory, and a dropdown menu to select a role to equip
   * @param {Interaction} interaction 
   */
  displayInventory(interaction) {
    //Implement this method @SapphireSapphic
  }

  /**
   * Equips a role from the user's inventory, and removes all other roles from the user that are part of the inventory system
   * As calculated from the available roles
   * @param {string} role The role to equip
   * @returns {boolean} True if the role was equipped, false if the role was not in the inventory
   */
  equipRole(role) {
    //Implement this method @SapphireSapphic
  }

  /**
   * Removes a role from the user's inventory
   * @param {string} role The role to remove
   * @returns {boolean} True if the role was removed, false if the role was not in the inventory
   */
  unequipRole(role) {
    //Implement this method @SapphireSapphic
  }


  /**
   * Handles the selection of a role from a dropdown menu
   * @param {Interaction} interaction 
   */
  handleRoleInventorySelectionDropdown(interaction) {
    //Implement this method @SapphireSapphic
  }

  /**
   * Converts the inventory to a JSON string
   * @returns {string} The JSON string
   */

  toJSON() {
    return this.map(r => r.toString());
  }

}

module.exports = Inventory;