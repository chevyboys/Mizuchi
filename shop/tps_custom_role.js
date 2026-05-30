const ShopItem = require("../utils/Class.ShopItem");
const path = require('path');
const filename = path.basename(__filename);

module.exports = new ShopItem({
  id: filename, // the id of the item, should be unique and match the filename (without the .js extension) for simplicity
  name: "Custom Armament",
  description: "A custom Armament designed to your specifications by the finest smiths.",
  price: 10000, // the cost
  currencyId: 4,
  processPurchaseCallback: async (interaction) => {
    await interaction.reply({ content: "*You are handed a coupon to be redeemed at a later time* ", ephemeral: false });
    return Promise.resolve({ success: true });
  }
});