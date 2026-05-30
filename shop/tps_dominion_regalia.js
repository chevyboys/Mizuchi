const ShopItem = require("../utils/Class.ShopItem.js");
const db = require("../utils/Utils.Database.js");



const roleSnowflakes = [
  { "name": "Fire Armament", "snowflake": "1506139786685976777" },
  { "name": "Water Armament", "snowflake": "1506140693217677342" },
  { "name": "Wind Armament", "snowflake": "1506141039231242290" },
  { "name": "Stone Armament", "snowflake": "1506141653990375504" },
  { "name": "Life Armament", "snowflake": "1506141936476618905" },
  { "name": "Death Armament", "snowflake": "1506142293210431558" },
  { "name": "Light Armament", "snowflake": "1506142693389242498" },
  { "name": "Shadow Armament", "snowflake": "1506142967868559501" },
  { "name": "Knowledge Armament", "snowflake": "1506143421964877874" },
  { "name": "Motion Armament", "snowflake": "1506145371347484763" },
  { "name": "Stability Armament", "snowflake": "1506145822004219984" },
  { "name": "Deception Armament", "snowflake": "1506144227007135795" },
];



module.exports = roleSnowflakes.map(role => {
  return new ShopItem({
    name: role.name,
    description: `Ah! I see you’re looking at our fine selection of enchanted goods!  Each of these are hand-crafted by our world-renowned crystal artisans; and every one of these many of a kind enchanted items are guaranteed to be genuine items that are enchanted.  Just so you know, it’s your lucky day as all of the multifaceted magical miscellany your eyes meander over are on sale for a limited time only!  (Add the ${role.name} Role to your /inventory.)`,
    price: 200,
    currencyId: 4,
    is_available: true,
    processPurchaseCallback: async (interaction) => {
      let inventory = await db.User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
      await inventory.add({
        granted_role_snowflake: role.snowflake,
        granted_guild_snowflake: interaction.guild.id,
        is_color: true,
        granted_by_user_snowflake: interaction.user.id,
        reason_for_award: "Purchase"
      });
      await interaction.reply({ content: `You either have a keen eye or sharp wit, that one is the best of the lot!  Just don’t go telling others that.  We wouldn’t want to disappoint them, y’know?  It’ll be our little secret that you already plundered the perfect product from among my paraphernalia.  Enjoy your purchase! (Use /inventory to equip the ${role.name} role)`, ephemeral: true });
      return Promise.resolve({ success: true });
    }
  })
});