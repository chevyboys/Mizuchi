const ShopItem = require("../utils/Class.ShopItem");
const database = require("../utils/Utils.Database");
const econDB = database.Economy;

module.exports = new ShopItem(
  "Ghost Bucks",
  "Give yourself some Ghost Bucks!",
  3,
  1, // Assuming 1 is the ID for the main currency used in the shop, and 2 is the id for test currency we are using for this item, which doesn't actually do anything yet
  //NOTE: The processPurchaseCallback is meant to handle giving the purchased item to the user, and any other side effects of purchasing the item. In this case, since Kudos doesn't actually do anything yet, we will just reply to the interaction to confirm the purchase.
  // YOU MUST MAKE SURE TO REPLY TO THE INTERACTION IN THE processPurchaseCallback, otherwise the user will see "This interaction failed" message after purchasing the item, which is not a good user experience. If the item doesn't actually do anything and you just want to confirm the purchase, you can reply with a simple message like "You have purchased [item name]!" or something like that.
  // YOU MUST also make sure to return a promise that resolves when the purchase has been processed, which in this case is just after we reply to the interaction. If you have any asynchronous code in the processPurchaseCallback, you should make sure to await it before returning, to ensure that the purchase is fully processed before the promise resolves.
  async (interaction) => {
    const numberOfPointsToGrant = 2;
    let GhostBucksId = 2; // Assuming 1 is the ID for the main currency used in the shop, and 2 is the id for test currency we are using for this item, which doesn't actually do anything yet
    await econDB.newTransaction(interaction.user.id, GhostBucksId, numberOfPointsToGrant, interaction.user.id, "conversion");
    await interaction.reply({ content: "You have purchased 2 Ghost Bucks!", ephemeral: true });
    return Promise.resolve({ success: true });
  }
);