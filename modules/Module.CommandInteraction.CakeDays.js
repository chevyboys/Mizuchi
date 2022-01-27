const e = require("express");

const Augur = require("augurbot"),
    u = require("../utils/Utils.Generic"),
    snowflakes = require('../config/snowflakes.json'),
    db = require("../utils/Utils.Database"),
    moment = require("moment"),
    Module = new Augur.Module();


async function celebrate() {
    let guild = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
    if (moment().hours() == 9) {
        testcakeOrJoinDays(guild).catch(error => u.errorHandler(error, "Test cakeOrJoinDays"));
    }
}



async function testcakeOrJoinDays(guild) {
    try {
        if (!guild || guild == undefined) guild = await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer)
        const curDate = moment();

        // cakeOrJoinDay Blast
        const flair = [
            ":tada: ",
            ":confetti_ball: ",
            ":birthday: ",
            ":gift: ",
            ":cake: "
        ];

        let cakeOrJoinDayPeeps = (await db.User.getMost()).filter(user => user.cakeDay != null);
        let messageContentArray = []
        for (let cakeOrJoinDayPeep of cakeOrJoinDayPeeps) {

            try {
                let date = moment(cakeOrJoinDayPeep.cakeDay);
                let member = await guild.members.cache.get(cakeOrJoinDayPeep.userID);
                cakeOrJoinDayPeep.username = member?.displayName || cakeOrJoinDayPeep.username;
                let sendString = "";
                if (date && (date.month() == curDate.month()) && (date.date() == curDate.date())) {
                    let join = member ? moment(member.joinedAt).subtract(0, "days") : curDate;
                    if (join && (join.month() == curDate.month()) && (join.date() == curDate.date()) && (join.year() < curDate.year())) {
                        let years = curDate.year() - join.year();
                        try {
                            sendString = ` **${cakeOrJoinDayPeep.username}** has been part of the server for ${years > 0 ? years : 1} ${(years > 1 ? "years" : "year")}! Glad you're with us!`;

                        } catch (e) { u.errorHandler(e, "Announce Cake Day Error"); continue; }
                    }
                    messageContentArray.push(`:birthday: :confetti_ball: :tada: Happy Cake Day, **${cakeOrJoinDayPeep.username}**!` + sendString + `:tada: :confetti_ball: :birthday:`);


                    if (member) u.addRoles(guild.members.cache.get(Module.client.user.id), member, snowflakes.roles.CakeDay);
                }
                else if (member && member.roles.cache.has(snowflakes.roles.CakeDay)) {
                    u.addRoles(guild.members.cache.get(Module.client.user.id), member, snowflakes.roles.CakeDay, true);
                }
            } catch (e) { u.errorHandler(e, "Birthay Send"); continue; }
        }


        arrayOfMessagesToSend = [];
        while (messageContentArray.join("\n").length > 800) {
            let thisMessageToSend = [];
            for (let index = 0; thisMessageToSend.join("\n").length < 800; index++) {
                thisMessageToSend.push(messageContentArray.shift())
            }
            arrayOfMessagesToSend.push(thisMessageToSend);
        }
        arrayOfMessagesToSend.push(messageContentArray)
        for (const message of arrayOfMessagesToSend) {
            await guild.channels.cache.get(snowflakes.channels.general).send(message.join("\n"));
        }

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
        permissions: (msg) => Module.config.adminId.includes(msg.author.id)
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
            if (cakeOrJoinDayDate) {
                console.log(`"${cakeOrJoinDayDate}"`);
                try {
                    let bd = new Date(cakeOrJoinDayDate);
                    if (bd == 'Invalid Date') {
                        interaction.reply({ content: "I couldn't understand that date. Please use Month Day format (e.g. Apr 1 or 4/1).", ephemeral: true });
                        return;
                    } else {
                        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
                        cakeOrJoinDayDate = months[bd.getMonth()] + " " + bd.getDate();
                        let cakeOrJoinDayUpdateTarget = interaction.member.id
                        if (target && (interaction.member.roles.cache.has(snowflakes.roles.Admin) || interaction.member.roles.cache.has(snowflakes.roles.BotMaster) || interaction.member.roles.cache.has(snowflakes.roles.Whisper) || interaction.member.roles.cache.has(snowflakes.roles.SoaringWings))) {
                            cakeOrJoinDayUpdateTarget = target.id
                        } else if (target && target != interaction.member) {
                            return interaction.reply({ content: "You don't have permission to do that", ephemeral: true });
                        }
                        await db.User.updateCakeDay(cakeOrJoinDayUpdateTarget, cakeOrJoinDayDate);
                        return interaction.reply({ content: "🎂", ephemeral: true });
                    }
                } catch (e) {

                    interaction.reply({ content: "It seems couldn't understand that date. Please use Month Day format (e.g. Apr 1 or 4/1).", ephemeral: true });
                    throw e;
                    return;
                }
            } else if (target && !cakeOrJoinDayDate) {
                let targetBd = await db.User.get(target.id)
                if (!targetBd) targetBd = await db.User.new(target.id);
                targetBd = targetBd.cakeDay
                let targetName = (await interaction.guild.members.fetch(target.id)).displayName
                return interaction.reply({ content: `${targetName}'s cake day is ${targetBd}`, ephemeral: true })
            } else {
                let userCake = await db.User.get(interaction.member.id)

                let users = await db.User.getMost();
                let now = new Date(Date.now());
                //return new Date(`${ userDbObj.cakeDay } ${ now.getFullYear() }`) > now;
                let sortedUsers = await users.filter(u => new Date(`${u.cakeDay} ${now.getFullYear()}`) > now).sort((a, b) => {
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
    })

module.exports = Module;
