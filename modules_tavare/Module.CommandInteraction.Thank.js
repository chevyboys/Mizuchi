const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const Module = new Augur.Module();
const fs = require('fs');
const UtilsDatabase = require("../utils/Utils.Database");
const { GuildMember } = require("discord.js");


let thankProcess = async (interaction) => {
  let member = interaction.options.getMember("helper");
  let days = interaction?.options?.get("days")?.value || 1;
  let reason = interaction?.options?.get("reason")?.value;
  let d = new Date();
  d.setDate(d.getDate() + days)
  let data = {
    member: member.id,
    removeRoleTime: d.valueOf()
  }
  fs.writeFileSync(`./data/helpers/${member.id}.json`, JSON.stringify(data, null, 4));
  u.addRoles(member, [Module.config.snowflakes.roles.Helper]);
  interaction.reply({ content: `${member.displayName} has been given the <@&${Module.config.snowflakes.roles.Helper}> role for ${days} day(s)`, ephemeral: true });

  const numberOfPointsToGrant = 3;
  let TournamentPointsId = 1;
  await UtilsDatabase.Economy.newTransaction(member.id, TournamentPointsId, numberOfPointsToGrant, interaction.member.id, 'Thank');
  let validCurrencies = await UtilsDatabase.Economy.getValidCurrencies();
  //notify the mods
  let modCardEmbed = u.embed()
    .setColor(interaction.guild.roles.cache.get(Module.config.snowflakes.roles.Helper).hexColor)
    .setAuthor({ iconURL: member.displayAvatarURL(), name: member.displayName + " has been given a thank you by " + interaction.member.displayName })
    .setDescription(`The <@&${Module.config.snowflakes.roles.Helper}> role was given to ${member.displayName} for ${days} day(s), and they were given ${numberOfPointsToGrant} ${validCurrencies.find(c => c.id === TournamentPointsId).name}. \n\n`)
    .addField("Reason:", "```" + reason + "```")
  interaction.guild.channels.cache.get(Module.config.snowflakes.channels.modRequests).send({ embeds: [modCardEmbed] })

  let userPmEmbed = u.embed()
    .setColor(interaction.guild.roles.cache.get(Module.config.snowflakes.roles.Helper).hexColor)
    .setAuthor({ iconURL: interaction.member.displayAvatarURL(), name: interaction.member.displayName + " has sent you a thank you!" })
    .setDescription(`Thank you for helping out the staff members of ${interaction.guild.name}! Your efforts were noticed by the staff, and the ${interaction.guild.roles.cache.get(Module.config.snowflakes.roles.Helper).name} role was given to you for ${days} day(s)! \n Thank you so much! You will also receive a 10% boost to the amount of XP you earn in that time! In addition, you were given ${numberOfPointsToGrant} ${validCurrencies.find(c => c.id === TournamentPointsId).name}!.\n Keep up the good work!\n\n`)
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
  let guild = Module.client.guilds.cache.get(Module.config.snowflakes.guilds.PrimaryServer);
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
    await u.addRoles(member, [Module.config.snowflakes.roles.Helper], true);
    fs.unlinkSync(`./data/helpers/${member.id}.json`);
  }
}

//Run commands
Module.addInteractionCommand({
  name: "thank",
  process: async (interaction) => {
    thankProcess(interaction);
  }
}).setClockwork(() => {
  try {
    return setInterval(endThank, 60 * 60 * 1000);
  } catch (e) { u.errorHandler(e, "end thank clockwork error"); }
}).addEvent("ready", async () => { await endThank() });
module.exports = Module;