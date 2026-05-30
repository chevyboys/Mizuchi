const ShopItem = require("../utils/Class.ShopItem");
const database = require("../utils/Utils.Database");
const econDB = database.Economy;

module.exports = new ShopItem({
  name: "Judgement Token",
  description: "Ah yes, one of our more limited items. A token from the soaring wings to allow entrance into the spire. Be sure to bring a water bottle with you when you go. (This grants a single person one Ghost run Judgement)",
  price: 6000,
  is_available: true,
  currencyId: 1, // Assuming 1 is the ID for the main currency used in the shop, and 2 is the id for test currency we are using for this item, which doesn't actually do anything yet
  processPurchaseCallback: async (interaction) => {
    const numberOfPointsToGrant = 1;
    const Judgement_Token_Id = 3; // Assuming 1 is the ID for the main currency used in the shop, and 2 is the id for test currency we are using for this item, which doesn't actually do anything yet
    await econDB.newTransaction(interaction.user.id, Judgement_Token_Id, numberOfPointsToGrant, interaction.user.id, "Judgement Token");
    await interaction.reply({ content: "*The token is small, intricately designed, and feels surprisingly heavy for its size.* (Please reach out to Ghost to redeem this item)", ephemeral: true });
    return Promise.resolve({ success: true });
  }
}
);