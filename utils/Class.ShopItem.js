const db = require("./Utils.Database");
const econDB = db.Economy;
const snowflakes = require('../config/snowflakes.json');
const u = require("./Utils.Generic");
/**
 * A class representing an item that can be purchased in the shop.
 * @member {string} name the name of the item
 * @member {string} description a description of the item that will be shown in the shop
 * @member {number} price the price of the item in the shop, in the currency specified by currencyId
 * @member {number} currencyId the id of the currency that is used to purchase the item, should correspond to a valid currency in the database
 * @member {function|null} processPurchaseCallback a callback function that will be called when a user purchases the item. 
    It should take the following parameters: (interaction)
     and return a promise that resolves when the purchase has been processed. It doesn't need to handle deducting the currency from the user, as that will be handled automatically after the callback function resolves successfully. 
     The callback function is meant to handle giving the purchased item to the user, and any other side effects of purchasing the item.
 */
class Item {
  /**
   * 
   * @param {string} name 
   * @param {string} description 
   * @param {number} price 
   * @param {number} currencyId 
   * @param {function|null} processPurchaseCallback 
   */
  constructor(name, description, price, currencyId, processPurchaseCallback = null) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.currencyId = currencyId;
    this.currency = null;
    this._currencyLoadPromise = null;
    /* A callback function that will be called when a user purchases the item. 
    It should take the following parameters: (interaction)
     and return a promise that resolves when the purchase has been processed.*/
    this.processPurchaseCallback = processPurchaseCallback;
  }

  async hydrateCurrency(force = false) {
    if (this.currency && !force) return this.currency;

    if (!this._currencyLoadPromise || force) {
      this._currencyLoadPromise = econDB.getValidCurrencies()
        .then(currencies => {
          this.currency = currencies.find(c => c.id == this.currencyId) || null;
          return this.currency;
        })
        .catch(() => {
          this.currency = null;
          return null;
        })
        .finally(() => {
          this._currencyLoadPromise = null;
        });
    }

    return await this._currencyLoadPromise;
  }

  async getCurrency() {
    if (this.currency) return this.currency;
    return await this.hydrateCurrency();
  }

  async execute(interaction) {
    //respond to the interaction immediately to avoid the "This interaction failed" message, we will edit the response later if needed
    if (this.processPurchaseCallback) {
      //check if the user has enough currency to purchase the item
      let userBalanceObj = await db.User.getBalance(interaction.user.id);
      let userBalance = userBalanceObj.currencies.find(c => c.id == this.currencyId);
      if (!userBalance || userBalance.total < this.price) {
        await interaction.reply({ content: `You do not have enough ${userBalance ? userBalance.currencyName : "currency"} to purchase this item.`, ephemeral: true });
        return Promise.resolve();
      }
      let result = await this.processPurchaseCallback(interaction);
      if (result && result.success) {
        //if the purchase was successful, create a new transaction in the database for the user
        await econDB.newTransaction(
          interaction.user.id,
          this.currencyId,
          -this.price,
          interaction.user.id,
          `Purchase of ${this.name}`
        );

        let currency = await this.getCurrency();
        const currencyName = currency ? currency.name : "Unknown Currency";
        const currencyEmoji = currency ? currency.emoji : "";

        //send a message in bot-logs channel about the purchase
        let logChannel = await interaction.client.channels.fetch(snowflakes.channels.botSpam);
        let embed = u.embed().setTitle(`${interaction.user.tag} purchased ${this.name}`)
          .setDescription(`**Item:** ${this.name}\n**Price:** ${this.price} ${currencyEmoji} ${currencyName}\n**User:** <@${interaction.user.id}>\n They have ${userBalance.total - this.price} ${currencyEmoji} ${currencyName} remaining after this purchase.`)
          .setTimestamp();
        await logChannel.send({ embeds: [embed] });
        return Promise.resolve(result);
      }
      return Promise.resolve(result);
    } else {
      return Promise.resolve();
    }
  }
}

module.exports = Item;