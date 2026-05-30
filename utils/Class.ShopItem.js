const db = require("./Utils.Database");
const econDB = db.Economy;
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
   * @param {Object} constructionObj an object containing the properties needed to construct the item
   * @param {string} constructionObj.name 
   * @param {string} constructionObj.description 
   * @param {number} constructionObj.price 
   * @param {number} constructionObj.currencyId 
   * @param {boolean} [constructionObj.is_available=true] whether the item is available for purchase
   * @param {function|null} constructionObj.processPurchaseCallback 
   */
  constructor(constructionObj) {
    this.id = constructionObj.id;
    this.name = constructionObj.name;
    this.description = constructionObj.description;
    this.price = constructionObj.price;
    this.currencyId = constructionObj.currencyId;
    this.is_available = constructionObj.is_available !== undefined ? constructionObj.is_available : true;
    this.currency = null;
    this._currencyLoadPromise = null;
    /* A callback function that will be called when a user purchases the item. 
    It should take the following parameters: (interaction)
     and return a promise that resolves when the purchase has been processed.*/
    this.processPurchaseCallback = constructionObj.processPurchaseCallback;
  }

  async hydrateCurrency(guild, force = false) {
    if (this.currency && !force) return this.currency;

    if (!this._currencyLoadPromise || force) {
      this._currencyLoadPromise = econDB.getValidCurrencies(guild)
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

  async getCurrency(guild) {
    if (this.currency) return this.currency;
    return await this.hydrateCurrency(guild);
  }

  async checkAvailability(interaction) {
    //if this.is_available is a function pass the interaction to it and return the result, otherwise just return this.is_available
    if (typeof this.is_available === "function") {
      return await this.is_available(interaction);
    } else {
      return this.is_available;
    }
  }

  async execute(interaction) {
    //respond to the interaction immediately to avoid the "This interaction failed" message, we will edit the response later if needed
    if (this.processPurchaseCallback) {
      //check if the user has enough currency to purchase the item
      let userBalanceObj;
      try {
        userBalanceObj = await db.User.getBalance(interaction.user.id, interaction.guild.id);
      } catch (err) {
        //if the error includes no transactions for snowflake, that means the user has no balance, so we can just set their balance to 0 for the purposes of this check. If it's a different error, we should log it and return an error message to the user.
        if (err.message.includes("No transactions found for snowflake")) {
          userBalanceObj = { currencies: [] };
        } else {
          throw err;
        }
      }
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

        //Give Jace the money for this purchase, for him to be a gremlin with
        await econDB.newTransaction(
          "172862815961350144", // Jace's user ID
          this.currencyId,
          this.price * 0.7, //30% tax
          interaction.user.id,
          `Jace's cut of ${this.name}`
        );

        let currency = await this.getCurrency(interaction.guild);
        const currencyName = currency ? currency.name : "Unknown Currency";
        const currencyEmoji = currency && currency.emoji ? currency.emoji : "";

        //send a message in bot-logs channel about the purchase
        let logChannel = await interaction.client.channels.fetch(interaction.client.config.snowflakes.channels.botSpam);
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