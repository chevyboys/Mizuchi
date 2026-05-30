const Augur = require("augurbot"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic"),
  fs = require("fs"),
  UtilsDatabase = require("../utils/Utils.Database");
const DBCurrencyObject = UtilsDatabase.DBCurrencyObject;

const arcane_snowflake = "645343657075146772";

Module.addEvent("messageCreate", async (msg) => {
  //watch for the arcane bot level up message, and grant currency to the user who leveled up based on the level they reached
  if (!msg.author.id === arcane_snowflake || !msg.channel.id === Module.config.snowflakes.channels.botSpam) return;
  //The messages are structured as <@mention> has reached level <level>. GG!
  const regex = /<@!?(\d+)> has reached level (\d+)/;
  const match = msg.content.match(regex);
  if (!match) return;
  const userId = match[1];
  const level = parseInt(match[2]);
  //The amount of currency to grant is equal to the level reached, so level 5 would grant 5 currency, level 10 would grant 10 currency, etc.
  const amountToGrant = 10;
  await UtilsDatabase.Economy.newTransaction(userId, 4, amountToGrant, userId, `Arcane Bot Level Up Reward for reaching level ${level}`);
});

module.exports = Module;