const ShopItem = require("../utils/Class.ShopItem");

module.exports = new ShopItem(
  "Literally Nothing",
  "This item gives the wonderful satisfaction of purchasing something fun from the shop without the care or responsibility the other shop items provide! Ignore the 'made in Dania' sticker floating over in the corner. It's not attached to anything.",
  1000, // the cost
  1, // Assuming 1 is the ID for the main currency used in the shop, and 2 is the id for test currency we are using for this item, which doesn't actually do anything yet
  //NOTE: The processPurchaseCallback is meant to handle giving the purchased item to the user, and any other side effects of purchasing the item. In this case, since Kudos doesn't actually do anything yet, we will just reply to the interaction to confirm the purchase.
  // YOU MUST MAKE SURE TO REPLY TO THE INTERACTION IN THE processPurchaseCallback, otherwise the user will see "This interaction failed" message after purchasing the item, which is not a good user experience. If the item doesn't actually do anything and you just want to confirm the purchase, you can reply with a simple message like "You have purchased [item name]!" or something like that.
  // YOU MUST also make sure to return a promise that resolves when the purchase has been processed, which in this case is just after we reply to the interaction. If you have any asynchronous code in the processPurchaseCallback, you should make sure to await it before returning, to ensure that the purchase is fully processed before the promise resolves.
  async (interaction) => {
    await interaction.reply({ content: "You have successfully purchased your very own pet Nothing! Make sure to take good care of it, feed it every morning and give it lots of love.", ephemeral: false });
    return Promise.resolve({ success: true });
  }
);