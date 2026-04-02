const u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json');
const fs = require('fs');
const ShopItem = require("../utils/Class.ShopItem");

module.exports = new ShopItem(
  "Bonus XP",
  "Give yourself a temporary bonus XP role! (This will grant you extra XP for a limited time)",
  10, // the cost
  1, // Assuming 1 is the ID for the main currency used in the shop, and 2 is the id for test currency we are using for this item, which doesn't actually do anything yet
  //NOTE: The processPurchaseCallback is meant to handle giving the purchased item to the user, and any other side effects of purchasing the item. In this case, since Kudos doesn't actually do anything yet, we will just reply to the interaction to confirm the purchase.
  // YOU MUST MAKE SURE TO REPLY TO THE INTERACTION IN THE processPurchaseCallback, otherwise the user will see "This interaction failed" message after purchasing the item, which is not a good user experience. If the item doesn't actually do anything and you just want to confirm the purchase, you can reply with a simple message like "You have purchased [item name]!" or something like that.
  // YOU MUST also make sure to return a promise that resolves when the purchase has been processed, which in this case is just after we reply to the interaction. If you have any asynchronous code in the processPurchaseCallback, you should make sure to await it before returning, to ensure that the purchase is fully processed before the promise resolves.
  async (interaction) => {
    let days = 2; // The number of days the bonus XP role will last, you can adjust this as needed
    let member = await interaction.member;
    let d = new Date();
    d.setDate(d.getDate() + days)
    let data = {
      member: member.id,
      removeRoleTime: d.valueOf()
    }
    fs.writeFileSync(`./data/helpers/${member.id}.json`, JSON.stringify(data, null, 4));
    u.addRoles(member, [snowflakes.roles.Helper]);
    await interaction.reply({ content: `You have given yourself the bonus XP <@&${snowflakes.roles.Helper}> role for ${days} day(s)`, ephemeral: true });
    return Promise.resolve({ success: true });
  }
);