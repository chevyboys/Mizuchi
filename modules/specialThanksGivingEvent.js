const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Module = new Augur.Module
const fs = require('fs');
const commandName = "thankyou"
let cooldowns = new Set();
const cooldownHours = 1;
const debug = false;
const RoleClient = require("../utils/Utils.RolesLogin");


async function setHolidayRole() {
  const guild = await RoleClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
  const holidayRole = await guild.roles.fetch(snowflakes.roles.Holiday);
  holidayRole.setHoist(true)
  holidayRole.setColor("#f5a442")
  return await holidayRole.setName("Appreciated")
}

async function unsetHolidayRole() {
  const guild = await RoleClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
  const holidayRole = await guild.roles.fetch(snowflakes.roles.Holiday);
  holidayRole.setHoist(false)
  holidayRole.setColor("#00000")
  return await holidayRole.setName("Holiday")
}

let thankProcess = async (interaction, bypassWait) => {
  if (cooldowns.has(interaction.user.id) && !bypassWait) {
    return interaction.reply({ content: "You can only thank one person at a time. Try again in an hour.", ephemeral: true });
  }
  let helper = interaction?.options?.get("person")?.value;
  let reason = interaction?.options?.get("reason")?.value;
  let member = await interaction.guild.members.fetch(helper)
  let d = new Date()
  d.setHours(d.getHours() + 1);
  let data = {
    member: member.id,
    removeRoleTime: d.valueOf()
  }
  fs.writeFileSync(`./data/holiday/${member.id}.json`, JSON.stringify(data, null, 4));
  u.addRoles(member, [snowflakes.roles.Holiday]);
  interaction.reply({ content: `${member.displayName} has been given the <@&${snowflakes.roles.Holiday}> role for 1 hour`, ephemeral: true });

  //notify bot commands
  let modCardEmbed = u.embed()
    .setColor(interaction.guild.roles.cache.get(snowflakes.roles.Holiday).hexColor)
    .setAuthor({ iconURL: member.displayAvatarURL(), name: "Happy Thanksgiving!" })
    .setDescription(`Happy Thanksgiving ${member}!\n${interaction.member.displayName} sent you a big thankyou, and The <@&${snowflakes.roles.Holiday}> role was given to you for the next hour.`)
    .addField("Reason:", "```" + reason + "```")
  interaction.guild.channels.cache.get(snowflakes.channels.botSpam).send({ content: `<@${member.id}>`, embeds: [modCardEmbed], allowedMentions: { parse: ["users"] }, })
  if (!interaction.member.roles.cache.has(snowflakes.roles.Admin) && !interaction.member.roles.cache.has(snowflakes.roles.Moderator) && !interaction.member.roles.cache.has(snowflakes.roles.BotMaster)) {
    cooldowns.add(interaction.user.id);
    setTimeout(() => {
      // Removes the user from the set after X hours
      cooldowns.delete(interaction.user.id);
    }, cooldownHours * 60 * 60 * 1000);
  }
}

//Is it thanksgiving?
const today = new Date()
const lastOfNov = new Date(today.getFullYear(), 10, 30).getDay();
const turkyDay = (lastOfNov >= 4 ? 34 : 27) - lastOfNov;
function thanksgiving() {
  const now = new Date();
  return (now.getDate() == turkyDay && now.getMonth() == 10)
}
function thanksgivingTomorrow() {
  const now = new Date();
  return (now.getDate() == turkyDay - 1 && now.getMonth() == 10)
}

let manageCommand = async () => {
  const guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
  const commands = guild.commands;
  const command = await commands.cache.find(c => c.name == commandName)?.id;
  if (!thanksgiving() && !debug) {
    if (command) {
      await unsetHolidayRole();
      u.errorLog.send({ embeds: [u.embed().setColor("WHITE").setDescription("Thanksgiving event ended")] });
      return commands.delete(command)
    }
  } else if (!command) {
    u.errorLog.send({ embeds: [u.embed().setColor("WHITE").setDescription("Thanksgiving event started")] });
    const registeredCommand = await commands.create(
      new SlashCommandBuilder()
        .setName(commandName)
        .setDescription("Thank the person")
        .addUserOption(option =>
          option
            .setName('person')
            .setDescription('the person to thank')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("reason")
            .setDescription("the great thing the person did!")
            .setRequired(true)
        )
    )
    Module.client.interactions.commands.set(registeredCommand.id,
      {
        category: undefined,
        commandId: registeredCommand.id,
        description: registeredCommand.name,
        enabled: true,
        guildId: guild.id,
        hidden: false,
        info: registeredCommand.name,
        name: registeredCommand.name,
        permissions: true,
        process: (interaction) => thankProcess(interaction),
        syntax: "",
        execute: (interaction) => thankProcess(interaction)
      })
    await setHolidayRole()
    return registeredCommand;
  }
  return null;
}

const kickoff = () => {
  let startTime = new Date()
  startTime.setMonth(10)
  startTime.setDate(turkyDay)
  startTime.setHours(0)
  let endTime = new Date()
  endTime.setMonth(10)
  endTime.setDate(turkyDay + 1)
  endTime.setHours(0)

  const guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);

  guild.channels.cache.get(snowflakes.channels.general).send({
    embeds: [
      u.embed({
        color: "#f5a442"
      }).setDescription("*T'was the night before thanksgiving," +
        "\nWhile gathered all round, " +
        "\nThe staff members were thankful" +
        "\nFor all the friends that they'd found." +
        "\nThey sat and discussed what all they could do, " +
        "\nTo share some of thanksgiving with each one of you." +

        "\n\nA challenge they have for the climbers to see" +
        "\nA challenge to bring kindness and glee" +
        `\nBe thankful in <#${snowflakes.channels.general}> for big things and small` +
        `\nUse </thankyou:0> to give xp boosts to all` +

        "\n\nAn hour of boosts to each person you can grant," +
        "\nThough stacking more than one? well sadly you can't" +
        "\nA ten percent to all who receive" +
        "\nAt least until midnight, then the bonuses leave*")
        .setTitle("Thanksgiving special event")
        .setImage("https://i.swncdn.com/media/800w/via/5333-thanksgiving.jpg")
        .addFields([{
          name: "Event info", value: `Start time: <t:${Math.floor(startTime.getTime() / 1000)}>(<t:${Math.floor(startTime.getTime() / 1000)}:R>)\nEnd time: <t:${Math.floor(endTime.getTime() / 1000)}>(<t:${Math.floor(endTime.getTime() / 1000)}:R>)`
        }
        ])
    ]
  })

}

let endTurkey = async () => {
  let files = fs.readdirSync(`./data/holiday/`).filter(x => x.endsWith(`.json`));
  let rawData = [];
  let guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
  for (let i = 0; i < files.length; i++) {
    let data = JSON.parse(fs.readFileSync(`./data/holiday/${files[i]}`));
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
    await u.addRoles(member, [snowflakes.roles.Holiday], true);
    fs.unlinkSync(`./data/holiday/${member.id}.json`);
  }
}

//Run commands
Module.setClockwork(() => {
  try {
    return setInterval(() => {
      if ((new Date().getHours() > 22 && thanksgivingTomorrow()) || debug) {
        kickoff()
      }
      manageCommand();
    }, (debug ? 1 : 60) * 60 * 1000);
  } catch (e) { u.errorHandler(e, "thanksgiving clockwork error"); }
}).addEvent("ready", async () => {
  if ((new Date().getHours() > 22 && thanksgivingTomorrow()) || debug) {
    kickoff()
  }
  await manageCommand();
})
  .setClockwork(() => {
    try {
      return setInterval(endTurkey, 60 * 60 * 1000);
    } catch (e) { u.errorHandler(e, "endturkey clockwork error"); }
  })
  .setInit((data) => { if (data) cooldowns = data })
  .setUnload(() => { return cooldowns })
  .addCommand({
    name: "forcethanksgiving",
    description: "Forces the thanksgiving post in case of an error",
    hidden: true,
    process: async function (msg) {
      try {
        await msg.react("📃");
        kickoff();
      } catch (e) { u.errorHandler(e, msg); }
    },
    permissions: (msg) => Module.config.AdminIds.includes(msg.author.id)
  });
module.exports = Module;