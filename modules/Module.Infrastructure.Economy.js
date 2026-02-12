const Augur = require("augurbot"),
  Discord = require("discord.js"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json'),
  UtilsDatabase = require("../utils/Utils.Database");


async function createLeaderboardMessageObject(guild, currency = null) {
  let embed = u.embed()
    .setTitle(`Currency Leaderboard`)
    .setDescription(`Select a currency from the dropdown below to see the leaderboard for that currency.`);

  let currencies = await UtilsDatabase.Economy.getValidCurrencies();
  let options = currencies.map(c => ({ label: c.name, value: c.id }));

  let placeholder = "Select a currency";
  if (currency) {
    let currencyObj = currencies.find(c => c.id === currency || c.name.toLowerCase() === currency.toLowerCase());
    if (currencyObj) {
      placeholder = currencyObj.name;
    } else {
      placeholder = "Currency not found";
    }

    let leaderboard = await UtilsDatabase.Economy.getLeaderboard(currencyObj.id);
    if (leaderboard.length === 0) {
      embed.setDescription(`No one has any ${currencyObj.name} yet.`);
    } else {
      let emoji = currencyObj.emoji || "";
      let description = `Top ${leaderboard.length} users with the most ${emoji}:`;
      for (let entry of leaderboard) {
        let guildMember = await guild.members.fetch(entry.userID).catch(() => null);
        let username = guildMember ? guildMember.displayName() : entry.username;
        description += `\n**${username}**: ${entry.total}`;
      }
      embed.setDescription(description);
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

function canGrantCurrency(member) {
  return member.permissions.has("ADMINISTRATOR")
    || member.roles.cache.has(snowflakes.roles.Moderator)
    || member.roles.cache.has(snowflakes.roles.Admin)
    || member.roles.cache.has(snowflakes.roles.BotAssistant)
    || member.roles.cache.has(snowflakes.roles.BotMaster);
}

Module.addInteractionCommand({
  name: "economy",
  description: "Manage and view currency balances",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "balance": {
        let user = interaction.options.getUser("user") || interaction.user;
        let balanceTotalObject = await UtilsDatabase.User.getBalance(user.id);

        if (balanceTotalObject === null) {
          return interaction.reply({ content: `${user.tag} doesn't have any balances yet.`, ephemeral: true });
        }

        let embed = u.embed()
          .setTitle(`${user.tag}'s Balance`)
          .setThumbnail(user.displayAvatarURL({ dynamic: true }));

        for (let currency of balanceTotalObject.currencies) {
          embed.addFields({ name: currency.name, value: currency.amount.toString(), inline: true });
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

        let currencies = await UtilsDatabase.Economy.getValidCurrencies();
        let currencyObj = currencies.find(c => c.id === currencyOption || c.name.toLowerCase() === currencyOption.toLowerCase());
        if (!currencyObj) {
          return interaction.reply({ content: `Currency not found.`, ephemeral: true });
        }

        //check if the user has enough of the currency to give
        let giverBalance = await UtilsDatabase.User.getBalance(interaction.user.id);
        let giverCurrency = giverBalance.currencies.find(c => c.id === currencyObj.id);
        if (!giverCurrency || giverCurrency.amount < amount) {
          return interaction.reply({ content: `You don't have enough ${currencyObj.name} to give.`, ephemeral: true });
        }

        //don't allow giving negative amounts
        if (amount <= 0) {
          return interaction.reply({ content: `The amount of given currency must be positive.`, ephemeral: true });
        }

        //don't allow giving currency to yourself or to bots
        if (targetUser.id === interaction.user.id) {
          return interaction.reply({ content: `You can't give currency to yourself.`, ephemeral: true });
        }
        if (targetUser.bot) {
          return interaction.reply({ content: `The elemental declines your generous offer.`, ephemeral: true });
        }

        //subtract the amount from the giver and add it to the target user
        await UtilsDatabase.Economy.newTransaction(interaction.user.id, giverCurrency.id, -amount, interaction.user.id);
        await UtilsDatabase.Economy.newTransaction(targetUser.id, giverCurrency.id, amount, interaction.user.id);

        //send a success message
        interaction.reply({ content: `You gave ${amount} ${currencyObj.name} ${currencyObj.emoji || ""} to ${targetUser.tag}.`, ephemeral: false });
        break;
      }

      case "grant": {
        if (!canGrantCurrency(interaction.member)) {
          return interaction.reply({ content: `You don't have permission to use this command.`, ephemeral: true });
        }
        let targetUser = interaction.options.getUser("user");
        let amount = interaction.options.getInteger("amount");
        let currencyOption = interaction.options.getString("currency");

        let currencies = await UtilsDatabase.Economy.getValidCurrencies();
        let currencyObj = currencies.find(c => c.id === currencyOption || c.name.toLowerCase() === currencyOption.toLowerCase());
        if (!currencyObj) {
          return interaction.reply({ content: `Currency not found.`, ephemeral: true });
        }

        //don't allow granting currency to bots
        if (targetUser.bot) {
          return interaction.reply({ content: `The elemental declines your generous offer.`, ephemeral: true });
        }

        //we do allow granting negative amounts, as this can be used to take currency away from users

        //add the amount to the target user
        await UtilsDatabase.Economy.newTransaction(targetUser.id, currencyObj.id, amount, interaction.user.id);
        //send a success message
        interaction.reply({ content: `You granted ${amount} ${currencyObj.name} ${currencyObj.emoji || ""} to ${targetUser.tag}.`, ephemeral: false });
        break;
      }
    }
  }
}).addInteractionHandler({
  customId: "currency_leaderboard_select", process: async (interaction) => {
    let selectedCurrencyId = interaction.values[0];
    let replyObject = await createLeaderboardMessageObject(interaction.guild, selectedCurrencyId);
    replyObject.ephemeral = true;
    interaction.update(replyObject);
  }
});

//To register this command, add this json to the registrar folder:
/*
{
  "name": "economy",
  "description": "Manage and view currency balances",
  "options": [
    {
      "type": 1,
      "name": "balance",
      "description": "Check your currency balances or someone else's balance",
      "options": [
        {
          "type": 6,
          "name": "user",
          "description": "The user to check the balance of",
          "required": false
        }
      ]
    },
    {
      "type": 1,
      "name": "leaderboard",
      "description": "Check the currency leaderboard for a specific currency",
      "options": []
    },
    {
      "type": 1,
      "name": "give",
      "description": "Give a specific amount of currency to a user",
      "options": [
        {
          "type": 6,
          "name": "user",
          "description": "The user to give the currency to",
          "required": true
        },
        {
          "type": 4,
          "name": "amount",
          "description": "The amount of currency to give",
          "required": true
        },
        {
          "type": 3,
          "name": "currency",
          "description": "The currency to give (name or ID)",
          "required": true
        }
      ]
    },
    {
      "type": 1,
      "name": "grant",
      "description": "Grant a specific amount of currency to a user (admin only)",
      "options": [
        {
          "type": 6,
          "name": "user",
          "description": "The user to grant the currency to",
          "required": true
        },
        {
          "type": 4,
          "name": "amount",
          "description": "The amount of currency to grant (can be negative to take away currency)",
          "required": true
        },
        {
          "type": 3,
          "name": "currency",
          "description": "The currency to grant (name or ID)",
          "required": true
        }
      ]
    }
  ]
}
*/


module.exports = Module;