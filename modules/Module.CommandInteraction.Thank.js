const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json');
const Module = new Augur.Module
const fs = require('fs');
const UtilsDatabase = require("../utils/Utils.Database");


let thankProcess = async (interaction) => {
  let helper = interaction?.options?.get("helper")?.value;
  let days = interaction?.options?.get("days")?.value || 1;
  let reason = interaction?.options?.get("reason")?.value;
  let member = await interaction.guild.members.fetch(helper)
  let d = new Date();
  d.setDate(d.getDate() + days)
  let data = {
    member: member.id,
    removeRoleTime: d.valueOf()
  }
  fs.writeFileSync(`./data/helpers/${member.id}.json`, JSON.stringify(data, null, 4));
  u.addRoles(member, [snowflakes.roles.Helper]);
  interaction.reply({ content: `${member.displayName} has been given the <@&${snowflakes.roles.Helper}> role for ${days} day(s)`, ephemeral: true });

  const numberOfPointsToGrant = 3;
  let TournamentPointsId = 1;
  await UtilsDatabase.Economy.newTransaction(member.id, TournamentPointsId, numberOfPointsToGrant, interaction.member.id);
  //notify the mods
  let modCardEmbed = u.embed()
    .setColor(interaction.guild.roles.cache.get(snowflakes.roles.Helper).hexColor)
    .setAuthor({ iconURL: member.displayAvatarURL(), name: member.displayName + " has been given a thank you by " + interaction.member.displayName })
    .setDescription(`The <@&${snowflakes.roles.Helper}> role was given to ${member.displayName} for ${days} day(s), and they were given ${numberOfPointsToGrant} ${UtilsDatabase.Economy.getValidCurrencies().find(c => c.id === TournamentPointsId).name}. \n\n`)
    .addField("Reason:", "```" + reason + "```")
  interaction.guild.channels.cache.get(snowflakes.channels.modRequests).send({ embeds: [modCardEmbed] })

  let userPmEmbed = u.embed()
    .setColor(interaction.guild.roles.cache.get(snowflakes.roles.Helper).hexColor)
    .setAuthor({ iconURL: interaction.member.displayAvatarURL(), name: interaction.member.displayName + " has sent you a thank you!" })
    .setDescription(`Thank you for helping out the staff members of ${interaction.guild.name}! Your efforts were noticed by the staff, and the ${interaction.guild.roles.cache.get(snowflakes.roles.Helper).name} role was given to you for ${days} day(s)! \n Thank you so much! You will also recieve a 10% boost to the amount of XP you earn in that time! In addition, you were given ${numberOfPointsToGrant} ${UtilsDatabase.Economy.getValidCurrencies().find(c => c.id === TournamentPointsId).name}!.\n Keep up the good work!\n\n`)
    .addField(interaction.member.displayName + "'s listed reason:", "```" + reason + "```")

  try {
    member.user.send({ embeds: [userPmEmbed] });
  } catch (error) {
    interaction.editReply({ content: "It looks like " + member.displayName + " has me blocked, so I couldn't tell them about their reward" })
  }
}

let endThank = async () => {
  let files = fs.readdirSync(`./data/helpers/`).filter(x => x.endsWith(`.json`));
  let rawData = [];
  let guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
  for (let i = 0; i < files.length; i++) {
    let data = JSON.parse(fs.readFileSync(`./data/helpers/${files[i]}`));
    if (data.removeRoleTime)
      rawData.push({
        removeRoleTime: data.removeRoleTime,
        member: data.member
      });
  }
  let now = Date.now().valueOf();
  let oldThanks = rawData.filter(thank => thank.removeRoleTime < now)
  for (const oldThank of oldThanks) {
    let member = await guild.members.fetch(oldThank.member);
    await u.addRoles(member, [snowflakes.roles.Helper], true);
    fs.unlinkSync(`./data/helpers/${member.id}.json`);
  }
}

//Run commands
Module.addInteractionCommand({
  name: "thank",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    thankProcess(interaction);
  }
}).setClockwork(() => {
  try {
    return setInterval(endThank, 60 * 60 * 1000);
  } catch (e) { u.errorHandler(e, "end thank clockwork error"); }
}).addEvent("ready", async () => { await endThank() });
module.exports = Module;