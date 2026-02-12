const Augur = require("augurbot"),
  Discord = require("discord.js"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json'),
  UtilsDatabase = require("../utils/Utils.Database");


async function createLeaderboardMessageObject(guild, currency = null) {
  let botMember = guild.members.cache.get(guild.client.user.id);
  let botColor = botMember ? botMember.displayHexColor : null;

  let embed = u.embed()
    .setTitle(`Currency Leaderboard`)
    .setDescription(`Select a currency from the dropdown below to see the leaderboard for that currency.`);

  if (botColor) embed.setColor(botColor);

  let currencies = await UtilsDatabase.Economy.getValidCurrencies();
  let options = [];
  for (let currency of currencies) {
    let option = { label: currency.name, value: String(currency.id), emoji: currency.emoji || undefined };
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
    embed.setDescription(`No currencies have been created yet.`);
    return { embeds: [embed], components: [] };
  }

  let placeholder = "Select a currency";
  if (currency) {
    let currencyObj = currencies.find(c => c.id == currency || c.name.toLowerCase() == currency.toLowerCase());
    if (currencyObj) {
      placeholder = currencyObj.name;

      let leaderboard = await UtilsDatabase.Economy.getLeaderboard(currencyObj.id);
      if (leaderboard.length === 0) {
        let currencyDisplay = currencyObj.emoji ? `${currencyObj.emoji} ${currencyObj.name}` : currencyObj.name;
        embed.setDescription(`No one has any ${currencyDisplay} yet.`);
      } else {
        let currencyDisplay = currencyObj.emoji ? `${currencyObj.emoji} ${currencyObj.name}` : currencyObj.name;
        let description = `Top ${leaderboard.length} users with the most ${currencyDisplay}`;
        for (let entry of leaderboard) {
          let guildMember = await guild.members.fetch(entry.userID).catch(() => null);
          let username = guildMember ? guildMember.displayName : entry.username;
          description += `\n**${username}**: ${entry.total}`;
        }
        embed.setDescription(description);
      }
    } else {
      placeholder = "Currency not found";
      embed.setDescription(`Currency not found.`);
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
        let member = await interaction.guild.members.fetch(user.id).catch(() => null);
        let displayName = member ? member.displayName : user.username;
        let balanceTotalObject = await UtilsDatabase.User.getBalance(user.id);

        if (balanceTotalObject.currencies.length === 0) {
          return interaction.reply({ content: `${displayName} doesn't have any balances yet.`, ephemeral: true });
        }

        let botMember = interaction.guild.members.cache.get(interaction.client.user.id);
        let embedColor = (member && member.displayHexColor) ? member.displayHexColor : (botMember ? botMember.displayHexColor : null);

        let embed = u.embed()
          .setTitle(`${displayName}'s Balance`)
          .setThumbnail(user.displayAvatarURL({ dynamic: true }));

        if (embedColor) embed.setColor(embedColor);
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

        let currencies = await UtilsDatabase.Economy.getValidCurrencies();
        let currencyObj = currencies.find(c => c.id == currencyOption || c.name.toLowerCase() === currencyOption.toLowerCase());
        if (!currencyObj) {
          return interaction.reply({ content: `Currency not found.`, ephemeral: true });
        }

        //check if the user has enough of the currency to give
        let giverBalance = await UtilsDatabase.User.getBalance(interaction.user.id);
        let giverCurrency = giverBalance.currencies.find(c => c.id == currencyObj.id);
        if (!giverCurrency || giverCurrency.total < amount) {
          let currencyDisplay = currencyObj.emoji ? `${currencyObj.emoji} ${currencyObj.name}` : currencyObj.name;
          return interaction.reply({ content: `You don't have enough ${currencyDisplay} to give.`, ephemeral: true });
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
        let targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        let targetDisplayName = targetMember ? targetMember.displayName : targetUser.username;
        let currencyDisplay = currencyObj.emoji ? `${currencyObj.emoji} ${currencyObj.name}` : currencyObj.name;

        let botMember = interaction.guild.members.cache.get(interaction.client.user.id);
        let embedColor = botMember ? botMember.displayHexColor : null;

        let embed = u.embed()
          .setTitle(`Balance Transfer`)
          .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
          .setDescription(`You gave \`${amount}\` ${currencyDisplay} to ${targetDisplayName}.`);
        if (embedColor) embed.setColor(embedColor);

        interaction.reply({ embeds: [embed], ephemeral: false });
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
        await UtilsDatabase.Economy.newTransaction(targetUser.id, currencyObj.id, amount, interaction.user.id);
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

module.exports = Module;