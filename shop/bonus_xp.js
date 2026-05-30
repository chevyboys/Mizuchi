const u = require("../utils/Utils.Generic");
const fs = require('fs');
const ShopItem = require("../utils/Class.ShopItem");
const path = require('path');
const filename = path.basename(__filename);

module.exports = new ShopItem({
  id: filename, // the id of the item, should be unique and match the filename (without the .js extension) for simplicity
  name: "Adaptation Elixir",
  description: "Ah, you've found our elixirs! Very nice ones too. This one helps you develop essence more rapidly (This will grant you extra XP for a limited time)",
  price: 10, // the cost
  currencyId: 1, // Assuming 1 is the ID for the main currency used in the shop, and 2 is the id for test currency we are using for this item, which doesn't actually do anything yet
  is_available: true,
  //NOTE: The processPurchaseCallback is meant to handle giving the purchased item to the user, and any other side effects of purchasing the item. In this case, since Kudos doesn't actually do anything yet, we will just reply to the interaction to confirm the purchase.
  // YOU MUST MAKE SURE TO REPLY TO THE INTERACTION IN THE processPurchaseCallback, otherwise the user will see "This interaction failed" message after purchasing the item, which is not a good user experience. If the item doesn't actually do anything and you just want to confirm the purchase, you can reply with a simple message like "You have purchased [item name]!" or something like that.
  // YOU MUST also make sure to return a promise that resolves when the purchase has been processed, which in this case is just after we reply to the interaction. If you have any asynchronous code in the processPurchaseCallback, you should make sure to await it before returning, to ensure that the purchase is fully processed before the promise resolves.
  processPurchaseCallback: async (interaction) => {
    let days = 2; // The number of days the bonus XP role will last, you can adjust this as needed
    let member = await interaction.member;
    let d = new Date();
    d.setDate(d.getDate() + days)
    let data = {
      member: member.id,
      removeRoleTime: d.valueOf()
    }
    fs.writeFileSync(`./data/helpers/${interaction.guild.id}/${member.id}.json`, JSON.stringify(data, null, 4));
    await member.roles.add(interaction.guild.client.config.snowflakes.roles.Helper);
    await interaction.reply({ content: `*You feel no difference after you drink the foul tasting liquid, except perhaps vaguely queasy.* (You have the bonus XP <@&${interaction.guild.client.config.snowflakes.roles.Helper}> role for ${days} day(s))`, ephemeral: true });
    return Promise.resolve({ success: true });
  }
});
