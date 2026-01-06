const optButtons = require("../utils/Utils.CakedayOptButtons")
const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json'),
  config = require("../config/config.json"),
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
  console.log("Running testcakeOrJoinDays");
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
    let people_with_a_cakeday = (await Promise.all(
      cakeOrJoinDayPeeps.map(async (peep) => {
        let cakeOrJoinDayDate = peep.cakeDay;
        // fallback to join date if invalid
        if (!cakeOrJoinDayDate || cakeOrJoinDayDate.length < 3) {
          try {
            const member = await guild.members.fetch(peep.userID);
            cakeOrJoinDayDate = member.joinedAt;
          } catch {
            return null; // skip if member not found
          }
        }
        let start = moment(cakeOrJoinDayDate).subtract(1, 'days').year(curDate.year());
        let end = moment(cakeOrJoinDayDate).add(1, 'days').year(curDate.year());
        if (curDate.isBetween(start, end, 'day', '[]')) {
          return peep; // include this person
        }
        return null; // exclude
      })
    )).filter(Boolean); // remove nulls

    let total_people_right_now = 0;
    let peopleByYearsInGuild = {
    };

    for (const person of people_with_a_cakeday) {
      try {
        let member = await guild.members.fetch(person.userID);
        if (!member) continue;
        let joinedAt = moment(member.joinedAt);
        //If they joined in the last three days, skip them
        if (curDate.diff(joinedAt, 'days') < 3) continue;
        //check if they have the role already, meaning we've already celebrated them
        if (member.roles.cache.has(snowflakes.roles.CakeDay)) continue;
        let yearsInGuild = curDate.diff(joinedAt, 'years');
        if (!peopleByYearsInGuild[yearsInGuild]) {
          peopleByYearsInGuild[yearsInGuild] = [];
        }
        peopleByYearsInGuild[yearsInGuild].push({ member: member, userData: person });
        total_people_right_now += 1;
      } catch (e) {
        if (e.code === 10007) {
          // Unknown Member — user not in guild
          continue;
        }
        u.errorHandler(e, "cakeOrJoinDay member fetch error");
        continue;
      }
    }

    if (total_people_right_now == 0) {
      return;
      //No one to celebrate today
    }

    let valid_ansi_colors = [31, 32, 33, 34, 35, 36, 37];

    let embed = u.embed()
      .setTitle("Thrice Fold Name Day")
      .setColor(guild.roles.cache.get(snowflakes.roles.CakeDay).color || guild.members.me.displayHexColor)
      .setFooter({ text: "Thrice-fold Name Days are a once a year three day celebration of you joining the server. To set your thrice-fold name day or opt out, use /nameday" })
      .setDescription("The name day is an old tradition, older even than me. Though in many cultures it has degenerated into a ceremony of toys and cakes, we remember the true purpose of the day: The choosing. \n\nWe ask you to tell us this year, what " + (total_people_right_now == 1 ? "is" : "are") + " your name" + (total_people_right_now == 1 ? ", child" : "s, children") + " ?\n\n");
    //add a field for each year group
    let embedFeilds = [];
    for (const [years, people] of Object.entries(peopleByYearsInGuild)) {
      let embedField = {
        name: `${years} year${years == 1 ? "" : "s"}:`,
        value: "\`\`\`ansi\n\[2;" + valid_ansi_colors[Math.floor(Math.random() * valid_ansi_colors.length)] + "m",
        inline: true
      };
      for (const person of people) {
        embedField.value += `${(person.member.displayName)} - ${person.userData.cakeDay}\n`;
        //Give them the role
        try {
          await person.member.roles.add(snowflakes.roles.CakeDay, "Thrice-fold Name Day Celebration");
          //Send them a DM
        } catch (e) {
          u.errorHandler(e, "cakeOrJoinDay role add error");
        }
      }
      embedField.value += "\[0m\`\`\`";
      embedFeilds.push(embedField);
    }
    embed.addFields(embedFeilds);

    //check if we have more than 25 fields, if so, split into multiple embeds

    let embeds = [];
    let currentEmbed = u.embed()
      .setTitle(embed.title)
      .setColor(embed.color)
      .setFooter(embed.footer)
      .setDescription(embed.description);
    for (const field of embed.fields) {
      if (currentEmbed.fields.length >= 25) {
        embeds.push(currentEmbed);
        currentEmbed = u.embed()
          .setTitle(embed.title)
          .setColor(embed.color)
          .setFooter(embed.footer);
      }
      currentEmbed.addFields(field);
    }
    if (currentEmbed.fields.length > 0) {
      embeds.push(currentEmbed);
    }
    let channel = await guild.channels.fetch(snowflakes.channels.general);
    //content for the first message
    let content = ((total_people_right_now == 1 ? "A child joins" : "Children join") + " us today for an old tradition. We are honored that you would join us on your name day.");
    //send all embeds
    let first = true;
    for (const em of embeds) {

      //check if we are on the last embed to add buttons
      if (em == embeds[embeds.length - 1]) {
        if (first) {
          //first and last, add content
          channel.send({ content: content, embeds: [em], components: optButtons });
          first = false;
          continue;
        }
        //last embed, add buttons
        channel.send({ embeds: [em], components: optButtons });
      } else {
        if (first) {
          //first embed, add content
          channel.send({ content: content, embeds: [em] });
          first = false;
          continue;
        }
        //normal embed

        channel.send({ embeds: [em] });

      }
    }

    //remove the role for people who's celebration is over
    let cakeDayRole = guild.roles.cache.get(snowflakes.roles.CakeDay);
    let membersWithRole = cakeDayRole.members;
    for (const [memberId, member] of membersWithRole) {
      try {
        let personData = await db.User.get(memberId);
        if (!personData || personData.cakeDay == null || personData.cakeDay == "opt-out") {
          //no cakeOrJoinDay set, remove role
          await member.roles.remove(snowflakes.roles.CakeDay, "No thrice-fold Name Day set");
          continue;
        }
        //use the join date if cakeOrJoinDay is invalid
        if (personData.cakeDay.length < 3) {
          personData.cakeDay = (await guild.members.fetch(memberId)).joinedAt;
        }
        let startOfThriceFoldNameDate = moment(personData.cakeDay).subtract(1, 'days');
        let endOfThriceFoldNameDate = moment(personData.cakeDay).add(1, 'days');
        if (!curDate.isBetween(startOfThriceFoldNameDate, endOfThriceFoldNameDate, 'day', '[]')) {
          //not in their cakeOrJoinDay, remove role
          await member.roles.remove(snowflakes.roles.CakeDay, "Thrice-fold Name Day period over");
        }
      } catch (e) {
        u.errorHandler(e, "cakeOrJoinDay role removal error");
        continue;
      }
    }

  } catch (e) { u.errorHandler(e, "cakeOrJoinDay Error"); }
}


Module
  .addCommand({
    name: "happynameday",
    description: "It's your nameDay!?",
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
    name: "nameday",
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
            return interaction.reply({ content: "🎂 Thrice fold nameday set to " + cakeOrJoinDayDate + " 🎂", ephemeral: true });
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
          return interaction.reply({ content: `${targetName} has opted out of name day participation`, ephemeral: true })
        }
        else return interaction.reply({ content: `${targetName}'s name day is ${targetBd}`, ephemeral: true })
      } else {
        let userCake = await db.User.get(interaction.member.id)
        if (userCake.cakeDay.indexOf("opt") > -1) {
          userCake = null;
        }
        await interaction.deferReply({ ephemeral: true });

        //get people with cakeOrJoinDays in the next 7 days
        //filter to only those with a cakeOrJoinDay set, not opted out, not the user themselves, and with a date in the future within 7 days
        //return new Date(`${ userDbObj.cakeDay } ${ now.getFullYear() }`) > now;
        let cakeOrJoinDayPeeps = (await db.User.getMost()).filter(user => user.cakeDay != null
          && user.cakeDay != "opt-out"
          && user.userID != interaction.member.id
          && moment(new Date(`${user.cakeDay} ${moment().year()}`)).isAfter(moment())
          && moment(new Date(`${user.cakeDay} ${moment().year()}`)).diff(moment(), 'days') <= 7
        );

        //sort by nearest date in the future
        cakeOrJoinDayPeeps.sort((a, b) => {
          let aDate = new Date(`${a.cakeDay} ${moment().year()}`);
          let bDate = new Date(`${b.cakeDay} ${moment().year()}`);
          return aDate - bDate;
        });
        //limit to 10 results
        cakeOrJoinDayPeeps = cakeOrJoinDayPeeps.slice(0, 10);

        for (const peep of cakeOrJoinDayPeeps) {
          //use the join date if cakeOrJoinDay is invalid
          if (peep.cakeDay.length < 3) {
            peep.cakeDay = (await interaction.guild.members.fetch(peep.userID)).joinedAt;
          }
          try {
            let member = await interaction.guild.members.fetch(peep.userID);
            peep.displayName = member.displayName;
          } catch (error) {
            //member not found, remove from list
            cakeOrJoinDayPeeps = cakeOrJoinDayPeeps.filter(p => p.userID != peep.userID);
            continue;
          }
        }



        let upcomingCakeUsers = "\n\n**Upcoming Name Days:**\n";
        for (const uData of cakeOrJoinDayPeeps) {
          try {
            //just use the raw date string from the database
            upcomingCakeUsers += `**${(uData.displayName)}** - ${uData.cakeDay}\n`;
          } catch {
            continue;
          }


        }


        let userCakeString;
        if (!userCake) {
          userCakeString = "You haven't told me when your nameday is yet. To set it, use '/nameday date'"
        } else userCakeString = "Your nameday is " + userCake.cakeDay + "! to reset it, use '/nameday date'"

        let embed = u.embed()
          .setTitle("Upcoming Name Days:")
          .setDescription("```" + userCakeString + "```" + upcomingCakeUsers)
          .setColor("#ea596e");
        interaction.editReply({ embeds: [embed], ephemeral: true, allowedMentions: { parse: ['users'] } });


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
        return interaction.reply({ content: "Opt-in successful, your name day has been set to your server join date", ephemeral: true });
      } else return interaction.reply({ content: "You have already opted-in to namedays, your current nameday is " + targetBd, ephemeral: true });
    }
  }).addInteractionHandler({
    customId: "cakedayinfo",
    process: async (interaction) => {
      let targetBd = await db.User.get(interaction.member.id)
      if (!targetBd) targetBd = await db.User.new(target.id);
      targetBd = targetBd.cakeDay
      return interaction.reply({ content: "Thrice-fold Name Days are a once a year three day celebration of you joining the server. To set your thrice-fold name day or opt out, use /nameday. Those who opt-in get a special color and bonus xp for 72 hours on the day they select. \n\nTo ensure privacy, this feature was developed by members of this server to be absolutely sure your nameday won't be used for anything but celebrating you, on this server. \n\nYour nameday is currently set to " + targetBd, ephemeral: true });
    }
  });

module.exports = Module;
