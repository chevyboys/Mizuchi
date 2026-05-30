const ShopItem = require("../utils/Class.ShopItem.js");
const db = require("../utils/Utils.Database.js");

let level_role_snowflakes = [
  "1506147896146399293", //candle
  "1506148374666150008", //torch
  "1506149556453113856", //hearth
  "1506150118183927839", //signet
  "1506150455527608471", //regalia
  "1506150805831548998", //crown
  "1506151755577298954", //glade
  "1506152025069588610", //meadow
  "1506152357573169274", //forest
  "1506152621092638720", //lake
  "1506153458812588123", //ocean
  "1506153357939576862", //sky
]

let level_role_snowflakes_names = [
  "Candle",
  "Torch",
  "Hearth",
  "Signet",
  "Regalia",
  "Crown",
  "Glade",
  "Meadow",
  "Forest",
  "Lake",
  "Ocean",
  "Sky"
]


function is_at_least_level(interaction, levelSnowflake) {
  let member = interaction.guild.members.cache.get(interaction.user.id);
  //find which level role the member has, if any, and compare it to the levelSnowflake
  let memberLevelRole = member.roles.cache.find(role => level_role_snowflakes.includes(role.id));
  if (!memberLevelRole) return false; //if the member doesn't have any level role, they don't meet the requirement
  let memberLevelIndex = level_role_snowflakes.indexOf(memberLevelRole.id);
  let requiredLevelIndex = level_role_snowflakes.indexOf(levelSnowflake);
  return memberLevelIndex >= requiredLevelIndex; //the member meets the requirement if their level role is the same or higher than the required level role  
}

const path = require('path');
const filename = path.basename(__filename);


const roleSnowflakes = [
  {
    "id": filename + "_star",
    "name": "Star Rank Badge",
    "cost": 2000,
    "available": (interaction) => {
      return is_at_least_level(interaction, level_role_snowflakes[level_role_snowflakes_names.indexOf("Meadow")]); //meadow level
    },
    "description": "A small rectangle made of adamantine with a diamond embedded in it that fits within the palm of your hand, with your name on it. This signifies that you are the highest rank within the guild, most likely the most powerful person in any room you enter.",
    "purchase_message": "\"Ah, very nice. Glad to see you've survived this long. Guild leadership is very impressed with the effort you’ve put into your advancement. It is my honor, privilege, joy and to promote you to Star rank, Don’t forget to stop by The Dungeon to continue your training and enjoy the amenities found within.\"",
    "snowflake": "1506174143064838194"
  },
  {
    "id": filename + "_adamantine",
    "name": "Adamantine Rank Badge",
    "cost": 1500,
    "available": (interaction) => {
      return is_at_least_level(interaction, level_role_snowflakes[level_role_snowflakes_names.indexOf("Glade")]); //glade level
    },
    "description": "A small rectangle made of adamantine that fits within the palm of your hand with your name on it. This signifies that you are an expert adventurer and most likely the leader of your group.",
    "purchase_message": "\"We didn’t think you’d make it this far! In recognition of your unexpected tenacity, we are pleased to award you your promotion to Adamantine rank! This new chapter of your life will include access to the exclusive **Sky Lounge** to enjoy with other distinguished members of the Guild.\"",
    "snowflake": "1506170807011770378"
  },
  {
    "id": filename + "_bronze",
    "name": "Bronze Rank Badge",
    "cost": 1000,
    "available": (interaction) => {
      return is_at_least_level(interaction, level_role_snowflakes[level_role_snowflakes_names.indexOf("Crown")]); //crown level
    },
    "description": "A small rectangle made of polished bronze that fits within the palm of your hand with your name on it. This signifies that you are a fixture of the guild.",
    "purchase_message": "\"Hey, oh! It looks like your card finally came in! Congratulations on reaching Bronze rank, be sure to take advantage of the trainers available at the Guild headquarters that you have access to now! By the authority of the Ruin Reclamation and Restoration Society, I name You Bronze!\"",
    "snowflake": "1506168610786115644"
  },
  {
    "id": filename + "_copper",
    "name": "Copper Rank Badge",
    "cost": 750,
    "available": (interaction) => {
      return is_at_least_level(interaction, level_role_snowflakes[level_role_snowflakes_names.indexOf("Regalia")]); //regalia level
    },
    "description": "A small rectangle made of copper that fits within the palm of your hand with your name on it. This signifies that you have been proven to be a reliable member of the guild.",
    "purchase_message": "\"We wouldn't want your accomplishments to go unrecognized. We should promote you on the spot! By the authority of the Ruin Reclamation and Restoration Society, I name you a Copper.\"",
    "snowflake": "1506167647417405490"
  },
  {
    "id": filename + "_dirt",
    "name": "Dirt Rank Badge",
    "cost": 500,
    "available": (interaction) => {
      return is_at_least_level(interaction, level_role_snowflakes[level_role_snowflakes_names.indexOf("Signet")]); //signet level
    },
    "description": "A gently used scrap of leather with rough lettering inked upon it, signifying base competency at being an adventurer",
    "purchase_message": "\"You have passed the tests and proven that you are not a liability to yourself or others while adventuring.  Congratulations, You are Dirt.\"",
    "snowflake": "1506167243753656421"
  },
];



module.exports = roleSnowflakes.map(role => {
  return new ShopItem({
    id: role.id,
    name: role.name,
    description: role.description + `(Add the ${role.name} Role to your /inventory.)`,
    price: role.cost,
    currencyId: 4,
    is_available: async (interaction) => {
      let inventory = await db.User_Guild_Inventory.fetch(interaction.user.id, interaction.guild.id);

      // Check if they already have an item with this exact role snowflake in their inventory
      let alreadyOwns = inventory.some(item => item.granted_role_snowflake === role.snowflake);

      // If they own it, it is NOT available for purchase.
      return !alreadyOwns && role.available(interaction); // If they don't own it, check if it's available based on the level requirement
    },
    processPurchaseCallback: async (interaction) => {
      let inventory = await db.User_Guild_Inventory.fetch(interaction.user.id, interaction.guild.id);
      await inventory.add({
        granted_role_snowflake: role.snowflake,
        granted_guild_snowflake: interaction.guild.id,
        is_color: true,
        granted_by_user_snowflake: interaction.user.id,
        reason_for_award: "Purchase"
      });
      await interaction.reply({ content: role.purchase_message + `(Use /inventory to equip the ${role.name} role)`, ephemeral: true });
      return Promise.resolve({ success: true });
    }
  })
});