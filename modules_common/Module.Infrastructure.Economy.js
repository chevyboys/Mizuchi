const Augur = require("augurbot"),
  Discord = require("discord.js"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic"),
  fs = require("fs"),
  ShopItem = require("../utils/Class.ShopItem"),
  UtilsDatabase = require("../utils/Utils.Database");
const DBCurrencyObject = UtilsDatabase.DBCurrencyObject

//an object who's keys correspond to message IDs, and values are the user IDs of who caught the emoji in that message, to prevent multiple people from getting currency from reacting to the same message 
let who_caught_the_emoji_cache = {};
// Tracks which gemstone emoji the bot spawned on a message so reaction validation can stay local and fast.
let spawned_gem_emoji_cache = {};
const shopItemsCache = {};
let currency_caches_for_unload = {};

const Jace_IconURL = "https://drive.google.com/uc?export=view&id=16IbXiqSTlOlYgdpxHmIcZJ9lSUh_VWmv";
let Jace_Embed = () => u.embed().setAuthor({
  name: "Jace, Master Merchant of the Red Company",
  iconURL: Jace_IconURL
}).setColor("#ff9cbf").setThumbnail(Jace_IconURL);


async function createLeaderboardMessageObject(guild, currency = null) {
  let botMember = guild.members.cache.get(guild.client.user.id);
  let botColor = botMember ? botMember.displayHexColor : null;
  let embed = Jace_Embed()
    .setAuthor(`The Red Company's Richest`, Jace_IconURL)
    .setDescription(
      currency ? "Jace casually slides your bribe into his coat Oh, hey I have a delivery to sign for in the back, make sure you don't look at this ledger of everyone's credit rating here on the counter while I'm gone... *Jace walks backwards out of the front of the shop while winking and shooting finger guns*"
        : `Ha! Checking up on the neighbors eh? Listen, I'm not about to reveal market secrets to people, that wouldn't be ethical for a person of my position, right?`
    );

  let currencies = await UtilsDatabase.Economy.getValidCurrencies(guild.id);
  let options = [];
  let primaryCurrency = currencies.find(c => c.is_primary);
  for (let currency of currencies) {
    let cost_currency = primaryCurrency ? primaryCurrency : currency;
    let cost_string = cost_currency ? `${cost_currency.emoji || ""} ${cost_currency.name}` : "unknown currency";
    let option = { label: currency.name + "(Bribe cost: " + cost_string + ")", value: String(currency.id), emoji: currency.emoji || undefined };
    if (currency.emoji) {
      // Parse custom emoji format <:name:id> or <a:name:id>
      const customEmojiMatch = currency.emoji.match(/^<(a)?:(\w+):(\d+)>$/);
      if (customEmojiMatch) {
        option.emoji = { name: customEmojiMatch[2], id: customEmojiMatch[3], animated: !!customEmojiMatch[1] };
      } else {
        option.emoji = currency.emoji; // Unicode emoji
      }
    }
    options.push(option);
  }

  // If there are no currencies, return early without a select menu
  if (options.length === 0) {
    embed.setDescription(`Ha! Checking up on the neighbors eh? Well, unfortunately for you, even if I *were* willing to reveal market secrets, I don't have market records handy at the moment.`);
    return { embeds: [embed], components: [] };
  }

  let placeholder = "Pick a Ledger to peak at";
  if (currency) {
    let currencyObj = currencies.find(c => c.id == currency || c.name.toLowerCase() == currency.toLowerCase());
    if (currencyObj) {
      placeholder = currencyObj.name;

      let leaderboard = await UtilsDatabase.Economy.getLeaderboard(currencyObj.id, 10, guild.id);
      if (leaderboard.length === 0) {
        let currencyDisplay = currencyObj.emoji ? `${currencyObj.emoji} ${currencyObj.name}` : currencyObj.name;
        embed.setDescription(`No one has any ${currencyDisplay} yet.`);
      } else {
        let currencyDisplay = currencyObj.emoji ? `${currencyObj.emoji} ${currencyObj.name}` : currencyObj.name;
        let description = `Top ${leaderboard.length} customers with the most ${currencyDisplay}`;
        for (let entry of leaderboard) {
          let guildMember = await guild.members.fetch(entry.snowflake).catch(() => null);
          let username = guildMember ? guildMember.displayName : entry.username;
          description += `\n**${username}**: ${entry.total}`;
        }
        embed.setDescription(description);
      }
    } else {
      placeholder = "Hmmm..";
      embed.setDescription(`I don't recognize that coinage, Would you mind handing it over to my assistant?.`);
    }
  }

  let row = new Discord.MessageActionRow().addComponents(
    new Discord.MessageSelectMenu()
      .setCustomId("currency_leaderboard_select")
      .setPlaceholder(placeholder)
      .addOptions(options)
  );

  //create a dropdown of all the currencies in the database, and when a currency is selected, show the leaderboard for that currency

  return { embeds: [embed], components: [row] };

}

async function get_trust_me_role(guild) {
  let trustMeRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'trust me');
  //if the role doesn't exist, return the string "trust me" instead of a role mention
  let trustMeRoleMention = trustMeRole ? `<@&${trustMeRole.id}>` : 'trust me';
  return trustMeRoleMention;
}

async function createShopMessageObject(guild, selectedItemId = null) {
  let botMember = guild.members.cache.get(guild.client.user.id);
  let botColor = botMember ? botMember.displayHexColor : null;

  let trustMeRoleMention = await get_trust_me_role(guild);

  let embed = Jace_Embed()
    .setDescription(
      "Welcome, welcome! It looks like you're looking for something special today, " +
      "can I interest you in any of these rare and unique one-of-a-kind relics? " +
      "\nThese beauties are of the highest quality and you won't find anything " +
      `better anywhere else *${trustMeRoleMention}*.`
    );

  //If there is a selected item, show the details of that item, and make sure the purchase button is enabled
  if (selectedItemId && shopItemsCache[selectedItemId]) {
    let selectedItem = shopItemsCache[selectedItemId];
    if (selectedItem) {
      embed.setDescription(`**${selectedItem.name}**\n${selectedItem.description}\nPrice: ${selectedItem.price}`);
    }
  }

  let options = Object.keys(shopItemsCache).map(itemId => {
    let item = shopItemsCache[itemId];
    return { label: `${item.emoji || ""} ${item.price}: ${item.name}`, value: itemId, emoji: item.currency ? item.currency.emoji : undefined };
  });

  //sort options by currency, then by price
  options.sort((a, b) => {
    let currencyA = shopItemsCache[a.value].currency ? shopItemsCache[a.value].currency.name : "";
    let currencyB = shopItemsCache[b.value].currency ? shopItemsCache[b.value].currency.name : "";
    if (currencyA === currencyB) {
      return shopItemsCache[a.value].price - shopItemsCache[b.value].price;
    }
    return currencyA - currencyB;
  });

  // If there are no items in the shop, return early without a select menu
  if (options.length === 0) {
    embed.setDescription(`Oh, hey, listen, we just had a run of customers through here and we are cleaned out.  Sorry about that, but ${trustMeRoleMention}, I won't let you leave unsatisfied; come back later once I can restock and for any inconvenience I'll give you a great deal on your next purchase!  See, you feel great about that don't you?  Yeah you do!`);
    return { embeds: [embed], components: [] };
  }

  let placeholder = "Select an item";
  if (selectedItemId && shopItemsCache[selectedItemId]) {
    let selectedItem = shopItemsCache[selectedItemId];
    placeholder = `${selectedItem.emoji || ""} ${selectedItem.price}: ${selectedItem.name}`;
  }

  let row = new Discord.MessageActionRow().addComponents(
    new Discord.MessageSelectMenu()
      .setCustomId("shop_item_select")
      .setPlaceholder(placeholder)
      .addOptions(options)
  );

  let buttons = new Discord.MessageActionRow().addComponents(
    new Discord.MessageButton()
      .setCustomId("shop_purchase_button")
      .setLabel("Purchase")
      .setStyle("PRIMARY")
      .setDisabled(!selectedItemId) // Disable the purchase button if no item is selected
  );

  //create a dropdown of all the items in the shop, and when an item is selected, show the details for that item, and a button to purchase it

  return { embeds: [embed], components: [row, buttons] };
}


/**
 * @type {DBCurrencyObject|null}
 */
let tournamentPointsCurrency = null;

function canGrantCurrency(Module, member) {
  if (!member || !member.roles || !member.permissions) return false;
  return member.permissions.has("ADMINISTRATOR")
    || member.roles.cache.has(Module.config.snowflakes.roles.Moderator)
    || member.roles.cache.has(Module.config.snowflakes.roles.Admin)
    || member.roles.cache.has(Module.config.snowflakes.roles.BotAssistant)
    || member.roles.cache.has(Module.config.snowflakes.roles.BotMaster);
}

function weighted_random(options) {
  var i;

  var weights = [options[0].weight];

  for (i = 1; i < options.length; i++)
    weights[i] = options[i].weight + weights[i - 1];

  var random = Math.random() * weights[weights.length - 1];

  for (i = 0; i < weights.length; i++)
    if (weights[i] > random)
      break;

  return options[i].item;
}

/**
 * 
 * @param {DBCurrencyObject} currency 
 */
function getCurrencyEmojiByValue(currency) {
  if (!currency || !currency.spawn_data || !Array.isArray(currency.spawn_data)) return {};
  let spawnData = currency.spawn_data;

  return spawnData.reduce((acc, current) => {
    if (current && current.emoji) {
      acc[current.emoji] = current;
    }
    return acc;
  }, {});
}

let defaultDivisor = null; // 1 in 5000 chance for a gemstone to spawn in a message, which can be adjusted by the bot owner with the setcurrencyodds command
let baseOddsDivisor = null;

async function load(Module, data) {
  let currencies = await UtilsDatabase.Economy.getValidCurrencies(Module.config.snowflakes.guilds.PrimaryServer);
  currency_caches_for_unload.currencies = currencies; // Cache currencies for unload
  if (data) {
    who_caught_the_emoji_cache = data.who_caught_the_emoji_cache || {};
    spawned_gem_emoji_cache = data.spawned_gem_emoji_cache || {};
  }
  let guild_snowflake = Module.config.snowflakes.guilds.PrimaryServer;


  tournamentPointsCurrency = currencies.find(c => c.is_primary) || null;
  console.log(`Tournament Points Currency initialized: ${tournamentPointsCurrency ? tournamentPointsCurrency.name : 'Not found'}`);
  defaultDivisor = tournamentPointsCurrency ? tournamentPointsCurrency.spawn_on_1_out_of : 5000;
  baseOddsDivisor = defaultDivisor;

  let shopItems = fs.readdirSync("./shop").filter(file => file.endsWith(".js"));
  for (let itemFile of shopItems) {
    let item = require(`../shop/${itemFile}`);
    //make sure that we have an item of the ShopItem class, and that it has the required properties before adding it to the shop
    if (!(item instanceof ShopItem) || !item.name || !item.description || !item.price || !item.currencyId) {
      u.get_log_webhook(Module, Module.config.identifier).send({ embeds: [u.embed().setColor("RED").setDescription(`Error in shop item file ${itemFile}: Invalid or missing properties.`)] })
      continue;
    }

    //check to make sure this item is of a currency this bot/guild has access to
    if (!currencies.find(c => c.id === item.currencyId)) {
      continue;
    }

    //hydrate the currency for the item, so that we can display the correct emoji in the shop, and avoid asynchronous constructor issues in the ShopItem class
    if (typeof item.hydrateCurrency === "function") {
      await item.hydrateCurrency(Module.config.snowflakes.guilds.PrimaryServer);
    }

    let itemId = itemFile.replace(".js", "");
    if (shopItemsCache[itemId]) {
      u.get_log_webhook(Module, Module.config.identifier).send({ embeds: [u.embed().setColor("RED").setDescription(`Error in shop item file ${itemFile}: Duplicate item ID ${itemId} from ${shopItemsCache[itemId].name}.`)] });
      continue;
    }
    shopItemsCache[itemId] = item;
  }

}

Module.addCommand({
  name: "currencyodds",
  aliases: ["currencychance", "gemodds"],
  category: "Currency",
  description: "Shows the current base odds divisor used for gemstone spawns.",
  process: async (msg) => {
    let chancePercent = ((1 / baseOddsDivisor) * 100).toFixed(4);
    msg.reply(`Current base odds divisor is \`${baseOddsDivisor}\` (\`${chancePercent}%\` chance per message).`);
  }
}).addCommand({
  name: "setcurrencyodds",
  aliases: ["setgemodds"],
  category: "Currency",
  description: "Sets the base odds divisor used for gemstone spawns.",
  syntax: "<divisor>",
  info: "Example: `setcurrencyodds 5000`",
  permissions: (msg) => canGrantCurrency(Module, msg.member),
  process: async (msg, suffix) => {
    let newDivisor = Number.parseInt((suffix || "").trim(), 10);
    let warnstring = "";
    if (isNaN(newDivisor) || newDivisor <= 1 || newDivisor > 1000000) { //reset to default if the input isn't a number
      newDivisor = defaultDivisor;
      warnstring = "Invalid divisor provided. Resetting to default.";
    }
    baseOddsDivisor = newDivisor;
    let chancePercent = ((1 / baseOddsDivisor) * 100).toFixed(4);
    msg.reply(`Updated base odds divisor to \`${baseOddsDivisor}\` (\`${chancePercent}%\` chance per message). ${warnstring}`);
  }
}).addInteractionCommand({

  name: "economy",
  description: "Manage and view currency balances",

  process: async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "balance": {
        let user = interaction.options.getUser("user") || interaction.user;
        let member = await interaction.guild.members.fetch(user.id).catch(() => null);
        let displayName = member ? member.displayName : user.username;
        let balanceTotalObject = null;
        try {
          balanceTotalObject = await UtilsDatabase.User.getBalance(user.id, interaction.guild.id);
        } catch (error) {
          if (error.message.includes("No transactions")) {
            return interaction.reply({ content: `${displayName} doesn't have any balances yet.`, ephemeral: true });
          } else {
            throw error; // Re-throw unexpected errors
          }
        }
        if (!balanceTotalObject || !balanceTotalObject.currencies || balanceTotalObject.currencies.length === 0) {
          return interaction.reply({ content: `${displayName} doesn't have any balances yet.`, ephemeral: true });
        }

        let botMember = interaction.guild.members.cache.get(interaction.client.user.id);


        let embed = Jace_Embed()
          .setAuthor(`Red Company Ledger for ${displayName}`, Jace_IconURL)
          .setThumbnail(user.displayAvatarURL({ dynamic: true }));

        for (let currency of balanceTotalObject.currencies) {
          let currencyDisplay = currency.emoji ? `${currency.emoji} ${currency.name}` : currency.name;
          embed.addFields({ name: currencyDisplay, value: "```" + currency.total.toString() + "```", inline: true });
        }
        interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }

      case "leaderboard": {
        let replyObject = await createLeaderboardMessageObject(interaction.guild);
        replyObject.ephemeral = true;
        interaction.reply(replyObject);
        break;
      }

      case "give": {
        let targetUser = interaction.options.getUser("user");
        let amount = interaction.options.getInteger("amount");
        let currencyOption = interaction.options.getString("currency");

        let currencies = await UtilsDatabase.Economy.getValidCurrencies(interaction.guild.id);
        let currencyObj = currencies.find(c => c.id == currencyOption || c.name.toLowerCase() === currencyOption.toLowerCase());
        if (!currencyObj) {
          return interaction.reply({ content: `Currency not found.`, ephemeral: true });
        }

        //check if the user has enough of the currency to give
        let giverBalance = await UtilsDatabase.User.getBalance(interaction.user.id, interaction.guild.id);
        let giverCurrency = giverBalance.currencies.find(c => c.id == currencyObj.id);
        if (!giverCurrency || giverCurrency.total < amount) {
          let currencyDisplay = currencyObj.emoji ? `${currencyObj.emoji} ${currencyObj.name}` : currencyObj.name;
          return interaction.reply({ content: `I'm not running a charity here, you need to actually have ${currencyDisplay} to give.`, ephemeral: true });
        }

        //don't allow giving negative amounts
        if (amount <= 0) {
          let embed = Jace_Embed()
            .setDescription(`What do you think we are?  Thieves?  I've never stolen from anyone that didn't deserve it.`);
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        //subtract the amount from the giver and add it to the target user
        await UtilsDatabase.Economy.newTransaction(interaction.user.id, giverCurrency.id, -amount, interaction.user.id, `give`);
        const taxRate = 0.05; // 5% tax on gifts
        const taxAmount = Math.round(amount * taxRate * 100) / 100; // Round to 2 decimal places
        const amountAfterTax = amount - taxAmount;

        if (targetUser.bot) {
          await UtilsDatabase.Economy.newTransaction("172862815961350144", giverCurrency.id, amountAfterTax, interaction.user.id, `give`);
          let trustMeRoleMention = await get_trust_me_role(guild);
          let embed = Jace_Embed()
            .setDescription(`How kind!  I know just the thing to get them as well.  I'll make sure they know it was from you, ${trustMeRoleMention}.  I definitely won't be just keeping this money.`)
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        //If Jace isn't pocketing the coin,
        await UtilsDatabase.Economy.newTransaction(targetUser.id, giverCurrency.id, amountAfterTax, interaction.user.id, `give`);
        await UtilsDatabase.Economy.newTransaction("172862815961350144", giverCurrency.id, taxAmount, interaction.user.id, `gift tax`); // Add a transaction for the tax amount with null user ID to indicate it's a tax

        //send a success message
        let targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        let targetDisplayName = targetMember ? targetMember.displayName : targetUser.username;
        let currencyDisplay = currencyObj.emoji ? `${currencyObj.emoji} ${currencyObj.name}` : currencyObj.name;

        if (targetUser.id === interaction.user.id) {
          let embed = Jace_Embed()
            .setDescription(`Done!  Weird thing to ask, but who am I to judge?
            You receive \`${amountAfterTax}\` ${currencyDisplay}. (Tax: \`${taxAmount}\`) `);
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }



        let embed = Jace_Embed()
          .setDescription(`Courier service?  Sure we can handle that, Safely, Securely, aaand for a nominal service fee. You gave \`${amountAfterTax}\` ${currencyDisplay} to ${targetDisplayName}. (Tax: \`${taxAmount}\`)`);

        interaction.reply({ embeds: [embed], ephemeral: false });
        break;
      }

      case "grant": {
        if (!canGrantCurrency(Module, interaction.member)) {
          return interaction.reply({ content: `You don't have permission to use this command.`, ephemeral: true });
        }
        let targetUser = interaction.options.getUser("user");
        let amount = interaction.options.getInteger("amount");
        let currencyOption = interaction.options.getString("currency");

        let currencies = await UtilsDatabase.Economy.getValidCurrencies(interaction.guild.id);
        let currencyObj = currencies.find(c => c.id == currencyOption || c.name.toLowerCase() === currencyOption.toLowerCase());
        if (!currencyObj) {
          return interaction.reply({ content: `Currency not found.`, ephemeral: true });
        }

        //don't allow granting currency to bots
        if (targetUser.bot) {
          return interaction.reply({ content: `The elemental declines your generous offer.`, ephemeral: true });
        }

        //we do allow granting negative amounts, as this can be used to take currency away from users

        //add the amount to the target user
        await UtilsDatabase.Economy.newTransaction(targetUser.id, currencyObj.id, amount, interaction.user.id, `grant`);
        //send a success message
        let grantTargetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        let grantTargetDisplayName = grantTargetMember ? grantTargetMember.displayName : targetUser.username;
        let currencyDisplay = currencyObj.emoji ? `${currencyObj.emoji} ${currencyObj.name}` : currencyObj.name;

        let botMember = interaction.guild.members.cache.get(interaction.client.user.id);
        let embedColor = botMember ? botMember.displayHexColor : null;

        let embed = u.embed()
          .setTitle(`Balance Grant`)
          .setThumbnail(grantTargetMember.user.displayAvatarURL({ dynamic: true }))
          .setDescription(`You granted \`${amount}\` ${currencyDisplay} to ${grantTargetDisplayName}.`);
        if (embedColor) embed.setColor(embedColor);

        interaction.reply({ embeds: [embed], ephemeral: false });
        break;
      }

      case "shop": {
        let replyObject = await createShopMessageObject(interaction.guild);
        replyObject.ephemeral = true;
        interaction.reply(replyObject);
        break;
      }
    }
  }
}).addInteractionHandler({
  customId: "currency_leaderboard_select", process: async (interaction) => {
    let selectedCurrencyId = interaction.values[0];
    let primaryCurrency = await UtilsDatabase.Economy.getValidCurrencies(interaction.guild.id).then(currencies => currencies.find(c => c.is_primary));
    let chargedCurrency = await UtilsDatabase.DBCurrencyObject.fetch(primaryCurrency?.id || selectedCurrencyId, interaction.guild.id);
    let selectedCurrency = await UtilsDatabase.DBCurrencyObject.fetch(selectedCurrencyId, interaction.guild.id);

    ////////////////////////////////
    let userBalanceObj = await db.User.getBalance(interaction.user.id, interaction.guild.id);
    let userBalance = userBalanceObj.currencies.find(c => c.id == chargedCurrency.id);
    if (!userBalance || userBalance.total < this.price) {
      await interaction.reply({ content: `You do not have enough ${userBalance ? userBalance.currencyName : "currency"} to purchase this item.`, ephemeral: true });
      return Promise.resolve();
    }

    //if the purchase was successful, create a new transaction in the database for the user
    await UtilsDatabase.Economy.newTransaction(
      interaction.user.id,
      chargedCurrency.id,
      -1,
      interaction.user.id,
      `Leaderboard Bribe of ${selectedCurrency ? selectedCurrency.name : "Unknown Currency"}`
    );

    let currency = selectedCurrency;
    const currencyName = currency ? currency.name : "Unknown Currency";
    const currencyEmoji = currency && currency.emoji ? currency.emoji : "";

    ////////////////////////////////
    let replyObject = await createLeaderboardMessageObject(interaction.guild, selectedCurrencyId);
    replyObject.ephemeral = true;
    interaction.update(replyObject);
  }
}).addInteractionHandler({
  customId: "shop_item_select", process: async (interaction) => {
    let selectedItemId = interaction.values[0];
    let replyObject = await createShopMessageObject(interaction.guild, selectedItemId);
    replyObject.ephemeral = true;
    interaction.update(replyObject);
  }
}).addInteractionHandler({
  customId: "shop_purchase_button", process: async (interaction) => {
    //handle purchasing an item from the shop
    let selectedItemName = interaction.message.components[0].components[0].placeholder;
    //find the option that matches the selected item name, and get the corresponding item from the shopItemsCache
    let shopItem = null;
    interaction.message.components[0].components[0].options.forEach(option => {
      if (option.label === selectedItemName) {
        shopItem = shopItemsCache[option.value];
      }
    });

    if (!shopItem) {
      return interaction.reply({ content: `Selected item not found.`, ephemeral: true });
    }
    await shopItem.execute(interaction);
  }
})

  // add a rare chance for the emoji of currency 'Tournament Points' to be added to messages in the server.
  .addEvent("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!tournamentPointsCurrency) return; // If the currency doesn't exist, do nothing
    if (!tournamentPointsCurrency.spawn_data || tournamentPointsCurrency.spawn_data.length === 0) return; // If there is no spawn data, do nothing
    if (!tournamentPointsCurrency.spawn_on_1_out_of) return; // If there is no spawn odds defined, do nothing
    let randomNum = Math.random();
    //determine if the person has a role containing the word 'Carnelian' or 'Quartz' and double the odds for them if they do, otherwise use the base odds divisor
    let member = message.guild.members.cache.get(message.author.id) || await message.guild.members.fetch(message.author.id).catch(() => null);
    let isNewMember = member ? member.roles.cache.some(r => r.name.toLowerCase().includes("carnelian") || r.name.toLowerCase().includes("quartz")) : false;
    let effectiveOddsDivisor = isNewMember ? baseOddsDivisor / 2 : baseOddsDivisor;

    if (randomNum < (1 / effectiveOddsDivisor)) {
      //get weighted random emoji from the currencyEmoji array, where the weights are determined by the value of each emoji (higher value emojis are more rare)
      let emoji = weighted_random(tournamentPointsCurrency.spawn_data.map(c => ({ item: c.emoji, weight: 1 / c.currency_value * 100 })));
      message.react(emoji).then(() => {
        spawned_gem_emoji_cache[message.id] = emoji;
      }).catch(() => { });
    }
  }
  )
  //if someone reacts to a message with Tournament Points emoji, give a tournament point to that user if criteria is met
  .addEvent("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    if (!tournamentPointsCurrency) return; // If the currency doesn't exist, do nothing
    if (reaction.partial) await reaction.fetch();
    let message = reaction.message;
    if (message.partial) await message.fetch();
    let guild = message.guild;
    if (!guild) return;
    let member = guild.members.cache.get(user.id) || await guild.members.fetch(user.id);
    if (!member) {
      await message.react("❌");
      return;
    }

    let emojiString = reaction.emoji.toString();
    const currencyEmojiByValue = getCurrencyEmojiByValue(tournamentPointsCurrency) || {};
    let isGemEmoji = !!currencyEmojiByValue[emojiString];
    // Ignore unrelated reactions as early as possible.
    if (emojiString !== "👈" && !isGemEmoji) return;

    //if the user is a botmaster and the emoji is 👈, remove the reaction and replace it with a gemstone emoji
    if (emojiString === "👈") {
      if (!canGrantCurrency(Module, member)) return;
      try {
        reaction.remove().catch(() => { });
        message.react(weighted_random(tournamentPointsCurrency.spawn_data.map(c => ({ item: c.emoji, weight: 1 / c.currency_value * 100 })))).then((emoji) => {
          spawned_gem_emoji_cache[message.id] = emoji;
        }).catch(() => { });

      } catch (error) {
        //ignore error
      }
      return;
    }

    // If staff uses a gemstone emoji, remove their reaction without awarding points.
    // Only seed a bot reaction when the bot did not already own this gemstone on the message.
    if (canGrantCurrency(Module, member)) {
      let botAlreadyOwnedGem = spawned_gem_emoji_cache[message.id] === emojiString || reaction.me;
      try {
        reaction.remove().catch(() => { });
        if (!botAlreadyOwnedGem) {
          message.react(reaction.emoji).then((emoji) => {
            spawned_gem_emoji_cache[message.id] = emoji;
          }).catch(() => { });
          return;
        }
      } catch (error) {
        //ignore error
      }
    }

    //find the corresponding value for the emoji that was reacted with
    let currencyObj = currencyEmojiByValue[emojiString];
    if (!currencyObj) return;

    // Validate bot ownership before removing reactions to avoid false suspicious flags.
    let botHadReaction = spawned_gem_emoji_cache[message.id] === emojiString || reaction.me;
    if (!botHadReaction) {
      try {
        await reaction.users.fetch();
      } catch (error) {
        //ignore error
      }
      botHadReaction = reaction.users.cache.has(message.client.user.id);
    }
    if (!botHadReaction) {
      let modLogs = guild.channels.cache.get(Module.config.snowflakes.channels.modRequests); // #mod-logs
      if (modLogs) {
        let embed = u.embed()
          .setTitle(`Suspicious Reaction Detected`)
          .setDescription(`A reaction with the ${reaction.emoji.toString()} emoji was added to a message that didn't have a bot reaction, by <@${user.id}> in <#${message.channel.id}>. This may indicate an attempt to exploit the tournament points system.`)
          .addFields(
            { name: "Message Content", value: message.content || "No content", inline: false },
            { name: "Message Author", value: `<@${message.author.id}>`, inline: true },
            { name: "Reaction User", value: `<@${user.id}>`, inline: true },
            { name: "Message Link", value: `[Jump to Message](https://discord.com/channels/${guild.id}/${message.channel.id}/${message.id})`, inline: false }
          )
          .setTimestamp();
        modLogs.send({ embeds: [embed] });
      }
      return;
    }


    //try to remove the reaction (entirely, not just from one user), if the bot doesn't have permission to manage messages, just ignore the error and continue
    reaction.remove().catch(() => { });

    if (!member) return;
    let bot_channel = message.guild.channels.cache.get(Module.config.snowflakes.channels.botSpam);
    if (!bot_channel) return;

    //check if the message already has a recorded user who caught the emoji in the cache, and if it does, don't give currency to anyone
    if (who_caught_the_emoji_cache[message.id]) return;
    who_caught_the_emoji_cache[message.id] = user.id;
    delete spawned_gem_emoji_cache[message.id];

    console.log(`User ${user.tag} caught a ${emojiString} for currency id ${tournamentPointsCurrency?.id} emoji in message ${message.id} and received ${currencyObj.currency_value} points.`);
    console.log(tournamentPointsCurrency);

    //give the user tournament points
    await UtilsDatabase.Economy.newTransaction(
      user.id,
      tournamentPointsCurrency.id,
      currencyObj.currency_value,
      Module.client.user.id,
      `reaction caught`);

    //send a message to the bot channel announcing who caught the emoji
    let embed = u.embed()
      .setTitle(`${tournamentPointsCurrency.name} Caught!`)
      .setDescription(`<@${user.id}> has found a ${currencyObj.emoji} in <#${message.channel.id}> worth ${currencyObj.currency_value} ${tournamentPointsCurrency.name}${currencyObj.currency_value !== 1 ? "s" : ""}!`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor(currencyObj.color);
    bot_channel.send({ embeds: [embed] });
  }).setInit(async (data) => {
    // Initialize tournament points currency
    // Check the client state
    if (Module.client && Module.client.readyAt) {
      // HOT RELOAD: The bot is already fully connected. Run immediately.
      await load(Module, data);
    } else {
      // COLD BOOT: The bot is still logging in. Wait for the 'ready' event.
      Module.client.once("ready", () => load(Module, data));
    }
  }).setUnload(async () => {
    // Cache currencies for unload
    currency_caches_for_unload.who_caught_the_emoji_cache = who_caught_the_emoji_cache;
    currency_caches_for_unload.spawned_gem_emoji_cache = spawned_gem_emoji_cache;
    return currency_caches_for_unload;
  });

module.exports = Module;