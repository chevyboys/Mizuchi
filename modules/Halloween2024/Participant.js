const { Guild, Role, Message, MessageReaction, User, GuildMember, Collection } = require('discord.js');
const snowflakes = require('../../config/snowflakes.json')
const fs = require('fs');
const u = require('../../utils/Utils.Generic');
const event = require("./utils");
const NPCSend = require("./NPC");
const Inventory = require('./Inventory.Class');

const abilityUsedCollection = new Collection();

/**
 * Represents a participant in the Holiday module.
 * @class
 * @property {string} userID - The user ID of the participant.
 * @property {CountManager} Hostile - The hostile count manger of the participant.
 * @property {CountManager} Friendly - The friendly count manger of the participant.
 * @property {string} status - The status of the participant.
 * @property {number} lastAbilityUse - The last time the participant used an ability.
 * @property {boolean} canUseAbility - Whether the participant can use an ability right now.
 */

class ParticipantResolvable {

}
/**
 * Represents a participant in the Holiday module.
 * @class
 * @property {string} userID - The user ID of the participant.
 * @property {CountManager} Hostile - The hostile count manger of the participant.
 * @property {CountManager} Friendly - The friendly count manger of the participant.
 * @property {string} status - The status of the participant.
 * @property {number} lastAbilityUse - The last time the participant used an ability.
 * @property {boolean} canUseAbility - Whether the participant can use an ability right now.
 * @property {Inventory} inventory - The inventory of the participant as an array of roles.
 * @property {ParticipantManager} manager - The participant manager.
 */

class Participant {
  #_userID;
  #_Hostile;
  #_Friendly;
  #_status;
  #_lastAbilityUse;
  #_inventory;
  #_manager;
  #_canSendGift;

  /**
   * Creates a new participant.
   * @constructor
   * @param {ParticipantResolvable} resolvable - The resolvable to create the participant from.
   * @param {string} resolvable.userID - The user ID of the participant.
   * @param {iterable} resolvable.Hostile - The hostile count manger of the participant, or an iterable to convert to a collection.
   * @param {iterable} resolvable.Friendly - The friendly count manger of the participant, or an iterable to convert to a collection.
   * @param {string} resolvable.status - The status of the participant.
   * @param {Date} resolvable.lastAbilityUse - The last time the participant used an ability.
   * @param {Inventory} resolvable.inventory - The inventory of the participant as an array of roles.
   * @param {ParticipantManager} manager - The participant manager.
   * @param {boolean} canSendGift - Whether the participant can send a gift.
   * @returns {Participant} The new participant.
   */
  constructor(resolvable, manager) {
    //create a new participant
    if (!resolvable) throw new Error("No resolvable provided.");
    if (!resolvable.userID) throw new Error("No user ID provided.");
    this.#_userID = resolvable.userID;
    this.#_Hostile = resolvable.Hostile ? new CountManager(resolvable.Hostile) : new CountManager([]);
    this.#_Friendly = resolvable.Friendly ? new CountManager(resolvable.Friendly) : new CountManager([]);
    this.#_status = resolvable.status || "ACTIVE" // ACTIVE, BANNED, SUSPENDED, INACTIVE;
    this.#_lastAbilityUse = resolvable.lastAbilityUse ? new Date(resolvable.lastAbilityUse) : Date.now() - 1000 * 60 * event.abilityCooldownMinutes;
    this.#_inventory = new Inventory(resolvable.inventory) || new Inventory();
    this.#_manager = manager;
    this.#_canSendGift = resolvable.canSendGift || false;
  }

  /**
   * Gets the user ID of the participant.
   * @returns {string} The user ID.
   */
  get userID() {
    return this.#_userID;
  }

  /**
   * Gets the hostile count manager of the participant.
   * @returns {CountManager} The hostile count manager.
   * @example
   * const participant = new Participant({
   *  userID: "1234567890",
   * Hostile: [1, 2, 3],
   * Friendly: [4, 5, 6],
   * status: "ACTIVE",
   *  lastAbilityUse: 1234567890,
   * canUseAbility: true
   * });
   * participant.Hostile.add();
   * participant.Hostile.totalToday();
   * participant.Hostile.totalPrevious();
   * participant.Hostile.total();
   */

  get Hostile() {
    return this.#_Hostile;
  }

  /**
   * Gets the friendly count manager of the participant.
   * @returns {CountManager} The friendly count manager.
   * @example
   * const participant = new Participant({
   *  userID: "1234567890",
   * Hostile: [1, 2, 3],
   * Friendly: [4, 5, 6],
   * status: "ACTIVE",
   *  lastAbilityUse: 1234567890,
   * canUseAbility: true
   * });
   * participant.Friendly.add();
   * participant.Friendly.totalToday();
   * participant.Friendly.totalPrevious();
   * participant.Friendly.total();
   */
  get Friendly() {
    return this.#_Friendly;
  }

  /**
   * Gets the status of the participant.
   * @returns {string} The status.
   */
  get status() {
    return this.#_status;
  }

  /**
   * Sets the status of the participant.
   * @param {string} status - The status Can be any one of the following: ACTIVE, BANNED, SUSPENDED, INACTIVE.
   */

  set status(status) {
    if (!["ACTIVE", "BANNED", "SUSPENDED", "INACTIVE"].includes(status)) throw new Error("Invalid status.");
    this.#_status = status;
  }

  /**
   * Gets the last time the participant used an ability.
   * @returns {Date} The last time the participant used an ability.
   */
  get lastAbilityUse() {
    return this.#_lastAbilityUse;
  }

  /**
   * Sets the last time the participant used an ability as now.
   */
  set lastAbilityUse(value) {
    this.#_lastAbilityUse = Date.now();
    abilityUsedCollection.set(this.userID, this.#_lastAbilityUse);
    //remmove the ability from the collection after the cooldown period
    setTimeout(() => {
      abilityUsedCollection.delete(this.userID);
    }, 1000 * 60 * event.abilityCooldownMinutes);
  }

  /**
   * Gets whether the participant can use an ability right now.
   * @returns {boolean} Whether the participant can use an ability right now.
   */
  get canUseAbility() {
    return abilityUsedCollection.has(this.userID);
  }

  /**
   * 
   * @returns {Inventory} The inventory of the participant as an array of roles.
   */

  get inventory() {
    return this.#_inventory;
  }

  /**
   * 
   * @returns {boolean} Whether the participant can send a gift.
   * @example
   * const participant = new Participant({
   * userID: "1234567890",
   * Hostile: [1, 2, 3],
   * Friendly: [4, 5, 6],
   * status: "ACTIVE",
   * lastAbilityUse: 1234567890,
   * canUseAbility: true,
   * inventory: [snowflakes.roles.Holiday[0], snowflakes.roles.Holiday[1], snowflakes.roles.Holiday[2]]
   * });
   * participant.canSendGift;
   */
  get canSendGift() {
    return this.#_canSendGift;
  }

  set canSendGift(bool) {
    if (typeof bool !== "boolean") throw new Error("Invalid boolean.");
    this.#_canSendGift = bool;
  }

  getCurrentTotalHostileFound() {
    return this.map(p => p.Hostile.totalToday()).reduce((a, b) => a + b, 0);
  }

  toJSON() {
    return {
      userID: this.userID,
      Hostile: this.Hostile.toJSON(),
      Friendly: this.Friendly.toJSON(),
      status: this.status,
      lastAbilityUse: this.lastAbilityUse,
      inventory: this.inventory.toJSON(),
      canSendGift: this.canSendGift
    }
  }


}

class ParticipantManager extends Collection {
  static singleton = null;
  static Participant = Participant;
  /**
   * Creates a new participant manager.
   * @constructor
   * @extends {Collection}
   * @param {Array} [iterable] - An iterable to convert to a collection.
   * @returns {ParticipantManager} The new participant manager.
   * @example
   * const participants = new ParticipantManager();
   * participants.add();
   * participants.get();
   * participants.delete();
   * participants.toJSON();
   */

  constructor(iterable) {
    super();
    //if iterable is not provided, try to read the participants from the file
    if (!iterable) {
      try {
        //check if the file exists
        if (fs.existsSync('./data/holiday/participants.json')) {
          iterable = require("../../data/holiday/participants.json")
        } else {
          iterable = [];
        };
      } catch (e) {
        iterable = [];
      }
    }
    iterable.forEach(element => {
      this.set(element.userID, new Participant(element, this));
    });
    ParticipantManager.singleton = this;
  }

  addParticipant(resolvable) {

    if (!resolvable) throw new Error("No resolvable provided.");
    if (!resolvable.userID) throw new Error("No user ID provided.");
    if (this.has(resolvable.userID)) return this.get(resolvable.userID);
    this.set(resolvable.userID, new Participant(resolvable, this));

  }

  /*
   * Gets the total count of Hostile reactions found by all participants for the event.
    * @returns {Number} The total count.
    * @example
    * const participants = new ParticipantManager();
    * participants.totalEventHostile();
    */
  totalEventHostile() {
    return this.map(p => p.Hostile.total()).reduce((a, b) => a + b, 0);
  }

  /**
   * Adds 1 to the Hostile count of a participant.
   * @param {string} userID - The user ID of the participant.
   * @param {Date} [date] - The date of the count.
  **/
  addHostile(userID, date = new Date()) {
    if (!this.has(userID)) this.set(userID, new Participant({ userID }));
    let returnable = this.get(userID).Hostile.add(date);
    return returnable;
  }

  /**
   * Adds 1 to the Friendly count of a participant.
   * @param {string} userID - The user ID of the participant.
   * @param {Date} [date] - The date of the count.
   * @returns {Number} The total count for today.
   * @example
   * const participants = new ParticipantManager();
   * participants.addFriendly("1234567890");
  **/
  addFriendly(userID, date = new Date()) {
    if (!this.has(userID)) this.set(userID, new Participant({ userID }));
    let returnable = this.get(userID).Friendly.add(date);
    return returnable;
  }

  /**
   * Gets the total Hostile count of a participant for today.
   * @param {string} userID - The user ID of the participant.
   * @returns {Number} The total count for today.
   * @example
   * const participants = new ParticipantManager();
   * participants.addHostile("1234567890");
   * participants.totalHostileToday("1234567890");
   * 
   */

  totalHostileToday(userID) {
    if (!this.has(userID)) return 0;
    return this.get(userID).Hostile.totalToday();
  }

  /**
   * Gets the total Friendly count of a participant for today.
   * @param {string} userID - The user ID of the participant.
   * @returns {Number} The total count for today.
   * @example
   * const participants = new ParticipantManager();
   * participants.addFriendly("1234567890");
   * participants.totalFriendlyToday("1234567890");
   */
  totalFriendlyToday(userID) {
    if (!this.has(userID)) return 0;
    return this.get(userID).Friendly.totalToday();
  }

  /**
   * Gets the total Hostile count of a participant for previous days.
   * @param {string} userID - The user ID of the participant.
   * @returns {Number} The total count for previous days.
   * @example
   * const participants = new ParticipantManager();
   * participants.addHostile("1234567890");
   * participants.totalHostilePrevious("1234567890");
   */
  totalHostilePrevious(userID) {
    if (!this.has(userID)) return 0;
    return this.get(userID).Hostile.totalPrevious();
  }

  /**
   * Gets the total Friendly count of a participant for previous days.
   * @param {string} userID - The user ID of the participant.
   * @returns {Number} The total count for previous days.
   * @example
   * const participants = new ParticipantManager();
   * participants.addFriendly("1234567890");
   * participants.totalFriendlyPrevious("1234567890");
   */
  totalFriendlyPrevious(userID) {
    if (!this.has(userID)) return 0;
    return this.get(userID).Friendly.totalPrevious();
  }


  /**
   * Gets the total Hostile count of a participant.
   * @param {string} userID - The user ID of the participant.
   * @returns {Number} The total count.
   * @example
   * const participants = new ParticipantManager();
   * participants.addHostile("1234567890");
   * participants.totalHostile("1234567890");
   */
  totalHostile(userID) {
    if (!this.has(userID)) return 0;
    return this.get(userID).Hostile.total();
  }

  /**
   * Gets the total Friendly count of a participant.
   * @param {string} userID - The user ID of the participant.
   * @returns {Number} The total count.
   * @example
   * const participants = new ParticipantManager();
   * participants.addFriendly("1234567890");
   * participants.totalFriendly("1234567890");
   */
  totalFriendly(userID) {
    if (!this.has(userID)) return 0;
    return this.get(userID).Friendly.total();
  }

  /**
   *  Adds a role to the inventory of a participant.
   * @param {string} userID - The user ID of the participant.
   * @param {string|Role} role - The role to add to the inventory.
   * @returns {boolean} True if the role was added, false if the role was already in the inventory.
   * @throws {Error} If the role is not available.
   */
  addRole(userID, role) {
    if (!this.has(userID)) this.set(userID, new Participant({ userID }));
    let returnable = this.get(userID).inventory.addRole(role);
    return returnable;
  }

  /**
   * Gets the roles available to the user as an array of snowflakes
   * @param {string} userID - The user ID of the participant.
   * @returns {Array<string>} An array of snowflakes
   */
  availableRoles(userID) {
    if (!this.has(userID)) return [];
    return this.get(userID).inventory.availableRoles;
  }

  /**
   * writes the participant manager to a file in '../../data/holiday/participants.json'
   */
  async write() {
    //If the file doesn't exist, create it
    let done = new Promise((resolve, reject) => {
      if (!fs.existsSync('./data/holiday')) fs.mkdirSync('./data/holiday');
      fs.writeFile('./data/holiday/participants.json', JSON.stringify(this.toJSON(), null, 2), (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    return done;

  }
}

/**
 * Represents a count of Emoji reactions found by a participant.
 * @class
 * @extends {Collection}
 * @method @property {Number} add - Adds a single count to the collection.
 * @method @property {Number} count - The count of the reactions.
 * @method @property {Number} totalToday - The total count for today.
 * @method @property {Number} totalPrevious - The total count for previous days.
 * @method @property {Number} total - The total count.
 */
class CountManager extends Collection {

  /**
   * Creates a new count manager.
   * @constructor
   * @extends {Collection}
   * @param {Array} [iterable] - An iterable to convert to a collection.
   * @returns {CountManager} The new count manager.
   * @example
   * const counts = new CountManager();
   * counts.add();
   * counts.totalToday();
   * counts.totalPrevious();
   * counts.total();
   */

  constructor(iterable) {
    //create a new collection, and if iterable is provided, create a collection from it
    super();
    for (const item of iterable) {
      this.set(item.key, item.value);
    }
  }

  /**
   * Adds a count to the collection.
   * @param {Date} [date] - The date of the count.
   * @returns {Number} The total count for today.
   */
  add(date = new Date(), ammount = 1) {
    //convert the date to the day of the month
    if (date instanceof Date) date = date.getDate();
    if (this.has(date)) {
      this.set(date, this.get(date) + ammount);
    } else {
      this.set(date, ammount);
    }
    return this.totalToday();
  }

  /**
   * Gets the total count from the collection for a specific day.
   * @param {Date} [date] - The date of the count.
   * @returns {Number} The total count.
   */
  totalToday() {
    return this.get(new Date().getDate()) || 0;
  }

  totalPrevious() {
    //get all the values from the collection except for today
    return Array.from(this.values()).reduce((a, b) => a + b, 0) - this.totalToday();
  }

  /**
   * Gets the total count from the collection.
   * @returns {Number} The total count.
   */
  total() {
    return Array.from(this.values()).reduce((a, b) => a + b, 0);
  }

  toJSON() {
    return this.map((v, k) => { return { key: k, value: v } });
  }

}


module.exports = ParticipantManager;