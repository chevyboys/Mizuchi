const optButtons = require("../utils/Utils.CakedayOptButtons")
const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json'),
  db = require("../utils/Utils.Database"),
  moment = require("moment"),

  Module = new Augur.Module();


async function celebrate() {
  let guild = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
  const TargetUSTime = 5; //5 AM is the target MST time. The Devs are MST based, so this was the easiest to remember
  const modifierToConvertToBotTime = 7;
  if (moment().hours() == TargetUSTime + modifierToConvertToBotTime) {
    testcakeOrJoinDays(guild).catch(error => u.errorHandler(error, "Test cakeOrJoinDays"));
  }
}



async function testcakeOrJoinDays(guild) {
  try {
    if (!guild || guild == undefined) guild = await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer)
    const curDate = moment();

    // cakeOrJoinDay Blast
    // eslint-disable-next-line no-unused-vars
    const flair = [
      ":tada: ",
      ":confetti_ball: ",
      ":birthday: ",
      ":gift: ",
      ":cake: "
    ];

    let cakeOrJoinDayPeeps = (await db.User.getMost()).filter(user => user.cakeDay != null && user.cakeDay != "opt-out");
    let messageContentArray = []
    for (let cakeOrJoinDayPeep of cakeOrJoinDayPeeps) {

      try {
        let date = moment(cakeOrJoinDayPeep.cakeDay);
        let member = await guild.members.cache.get(cakeOrJoinDayPeep.userID);
        cakeOrJoinDayPeep.username = member?.displayName || cakeOrJoinDayPeep.username;
        let sendString = "";
        if (date && (date.month() == curDate.month()) && (date.date() == curDate.date())) {
          let join = member ? moment(member.joinedAt).subtract(0, "days") : curDate;
          let years = curDate.year() - join.year();
          if (join && (join.month() == curDate.month()) && (join.date() == curDate.date()) && (join.year() < curDate.year())) {
            try {
              sendString = ` They have been part of the server for ${years > 0 ? years : 1} ${(years > 1 ? "years" : "year")}! Glad you're with us!`;

            } catch (e) { u.errorHandler(e, "Announce Cake Day Error"); continue; }
          }
          if (join && ((join.month() != curDate.month()) || (join.date() != curDate.date()) || (join.year() != curDate.year()))) {
            u.addRoles(member, snowflakes.roles.CakeDay);
            messageContentArray.push(`:birthday: :confetti_ball: :tada: Happy Cake Day, **${cakeOrJoinDayPeep.username}**!` + sendString + `:tada: :confetti_ball: :birthday:`);
          }
        }
        else if (member && member.roles.cache.has(snowflakes.roles.CakeDay)) {
          u.addRoles(member, snowflakes.roles.CakeDay, true);
        }
      } catch (e) { if (e.toString().indexOf("Deprecation warning: value provided is not in a recognized RFC2822 or ISO format.") < 0) u.errorHandler(e, "Birthay Send"); continue; }
    }

    if (messageContentArray.length == 0) return;
    let arrayOfMessagesToSend = [];
    while (messageContentArray.join("\n").length > 800) {
      let thisMessageToSend = [];
      for (let index = 0; thisMessageToSend.join("\n").length < 800; index++) {
        thisMessageToSend.push(messageContentArray.shift())
      }
      arrayOfMessagesToSend.push(thisMessageToSend);
      arrayOfMessagesToSend.push();
    }
    arrayOfMessagesToSend.push(messageContentArray)
    for (const message of arrayOfMessagesToSend) {
      await guild.channels.cache.get(snowflakes.channels.general).send(message.join("\n"));
    }
    guild.channels.cache.get(snowflakes.channels.general).send({
      content: "To opt-out of these, use `/cakeday opt-out` or click the button below",
      components: optButtons

    })

  } catch (e) { u.errorHandler(e, "cakeOrJoinDay Error"); }
}


Module
  .addCommand({
    name: "happycakeday",
    description: "It's your cakeDay!?",
    syntax: "<@user>", hidden: true,
    process: async (msg) => {
      await testcakeOrJoinDays();
      msg.react("🎂");
    },
    permissions: (msg) => Module.config.AdminIds.includes(msg.author.id)
  })
  .addEvent("ready", celebrate)
  .setClockwork(() => {
    try {
      return setInterval(celebrate, 60 * 60 * 1000);
    } catch (e) { u.errorHandler(e, "cakeOrJoinDay Clockwork Error"); }
  }).addInteractionCommand({
    name: "cakeday",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      let cakeOrJoinDayDate = (interaction.options.get("date")) ? (interaction.options.get("date")).value.trim().replace(/<+.*>\s*/gm, "") : null
      let target = interaction.options.getMember("target")
      if (interaction.options.getBoolean("opt-out") || cakeOrJoinDayDate == "opt-out") {
        //IF the opt-out option is true, or the date is set to opt out
        let cakeOrJoinDayUpdateTarget = interaction.member.id;
        if (target && (interaction.member.roles.cache.has(snowflakes.roles.Admin) || interaction.member.roles.cache.has(snowflakes.roles.BotMaster) || interaction.member.roles.cache.has(snowflakes.roles.Moderator) || interaction.member.roles.cache.has(snowflakes.roles.CommunityGuide))) {
          cakeOrJoinDayUpdateTarget = target.id;
        } else if (target && target != interaction.member) {
          return interaction.reply({ content: "You don't have permission to do that", ephemeral: true });
        }
        await db.User.updateCakeDay(cakeOrJoinDayUpdateTarget, "opt-out");
        return interaction.reply({ content: "opt-out successful", ephemeral: true });
      }
      else if (cakeOrJoinDayDate) {
        try {
          let bd = new Date(cakeOrJoinDayDate);
          if (bd == 'Invalid Date') {
            interaction.reply({ content: "I couldn't understand that date. Please use Month Day format (e.g. Apr 1 or 4/1).", ephemeral: true });
            return;
          } else {
            let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
            cakeOrJoinDayDate = months[bd.getMonth()] + " " + bd.getDate();
            let cakeOrJoinDayUpdateTarget = interaction.member.id
            if (target && (interaction.member.roles.cache.has(snowflakes.roles.Admin) || interaction.member.roles.cache.has(snowflakes.roles.BotMaster) || interaction.member.roles.cache.has(snowflakes.roles.Moderator) || interaction.member.roles.cache.has(snowflakes.roles.CommunityGuide))) {
              cakeOrJoinDayUpdateTarget = target.id
            } else if (target && target != interaction.member) {
              return interaction.reply({ content: "You don't have permission to do that", ephemeral: true });
            }
            await db.User.updateCakeDay(cakeOrJoinDayUpdateTarget, cakeOrJoinDayDate);
            return interaction.reply({ content: "🎂 Cakeday set to " + cakeOrJoinDayDate + " 🎂", ephemeral: true });
          }
        } catch (e) {

          interaction.reply({ content: "It seems couldn't understand that date. Please use Month Day format (e.g. Apr 1 or 4/1).", ephemeral: true });
          throw e;
        }
      } else if (target && !cakeOrJoinDayDate) {
        let targetBd = await db.User.get(target.id)
        if (!targetBd) targetBd = await db.User.new(target.id);
        targetBd = targetBd.cakeDay
        let targetName = (await interaction.guild.members.fetch(target.id)).displayName

        if (targetBd.indexOf("opt") > -1) {
          return interaction.reply({ content: `${targetName} has opted out of cakeday participation`, ephemeral: true })
        }
        else return interaction.reply({ content: `${targetName}'s cake day is ${targetBd}`, ephemeral: true })
      } else {
        let userCake = await db.User.get(interaction.member.id)
        if (userCake.cakeDay.indexOf("opt") > -1) {
          userCake = null;
        }


        let users = await db.User.getMost();
        let now = new Date(Date.now());
        //return new Date(`${ userDbObj.cakeDay } ${ now.getFullYear() }`) > now;
        let sortedUsers = await users.filter(u => u.cakeDay.indexOf("opt") > -1 && new Date(`${u.cakeDay} ${now.getFullYear()}`) > now).sort((a, b) => {
          let aCake = new Date(`${a.cakeDay} ${now.getFullYear()}`);
          let bCake = new Date(`${b.cakeDay} ${now.getFullYear()}`)
          return aCake - bCake;
        })
        let upcomingCakeUsers = sortedUsers.slice(0, 5).map(user => `${user.username} - ${user.cakeDay}`).join("\n")
        let userCakeString;
        if (!userCake) {
          userCakeString = "You haven't told me when your cakeDay is yet. To set it, use '/cakeday date'"
        } else userCakeString = "Your cakeday is " + userCake.cakeDay + "! to reset it, use '/cakeday date'"

        let embed = u.embed()
          .setTitle("Upcoming Cake Days:")
          .setDescription("```" + userCakeString + "```" + upcomingCakeUsers)
          .setColor("#ea596e");
        interaction.reply({ embeds: [embed], ephemeral: true, allowedMentions: { parse: ['users'] } });


      }
    }
  }).addInteractionHandler({
    customId: "cakedayopt-out",
    process: async (interaction) => {
      let targetBd = await db.User.get(interaction.member.id)
      if (!targetBd) targetBd = await db.User.new(interaction.member.id);
      targetBd = targetBd.cakeDay
      if (!targetBd.indexOf("opt-out" > -1)) {
        return interaction.reply({ content: "You have to be opted in to opt out", ephemeral: true });
      } else {
        await db.User.updateCakeDay(interaction.member.id, "opt-out");
        return interaction.reply({ content: "Opt-out successful", ephemeral: true });
      }
    }
  }).addInteractionHandler({
    customId: "cakedayopt-in",
    process: async (interaction) => {
      let targetBd = await db.User.get(interaction.member.id)
      if (!targetBd) targetBd = await db.User.new(interaction.member.id);
      targetBd = targetBd.cakeDay
      if (targetBd.indexOf("opt-out" > -1)) {
        let joinedAt = (Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)).members.cache.get(interaction.member.id).joinedAt
        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        let cakeOrJoinDayDate = months[joinedAt.getMonth()] + " " + joinedAt.getDate();
        await db.User.updateCakeDay(interaction.member.id, cakeOrJoinDayDate);
        return interaction.reply({ content: "Opt-in successful, your cake day has been set to your server join date", ephemeral: true });
      } else return interaction.reply({ content: "You have already opted-in to cakedays, your current cakeday is " + targetBd, ephemeral: true });
    }
  }).addInteractionHandler({
    customId: "cakedayinfo",
    process: async (interaction) => {
      let targetBd = await db.User.get(interaction.member.id)
      if (!targetBd) targetBd = await db.User.new(target.id);
      targetBd = targetBd.cakeDay
      return interaction.reply({ content: "Cakedays are a once a year celebration of you joining the server. You can set this to a custom date with the /cakeday command, or leave it as your server join date. Those who opt-in get a special color and bonus xp for 24 hours on the day they select. \n\nTo ensure privacy, this feature was developed by members of this server to be absolutely sure your cakeday won't be used for anything but celebrating you, on this server. \n\nYour cakeday is currently set to " + targetBd, ephemeral: true });
    }
  });

module.exports = Module;
