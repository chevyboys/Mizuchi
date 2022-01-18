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

        let cakeOrJoinDayPeeps = (await db.User.getAll()).filter(user => user.cakeDay != null);
        for (let cakeOrJoinDayPeep of cakeOrJoinDayPeeps) {
            try {
                let date = moment(cakeOrJoinDayPeep.cakeDay);
                let member = await guild.members.cache.get(cakeOrJoinDayPeep.userID);

                if (date && (date.month() == curDate.month()) && (date.date() == curDate.date())) {
                    let join = moment(member.joinedAt).subtract(0, "days");
                    if (join && (join.month() == curDate.month()) && (join.date() == curDate.date()) && (join.year() < curDate.year())) {
                        let years = curDate.year() - join.year();
                        try {

                            guild.channels.cache.get(snowflakes.channels.general).send(`${member} has been part of the server for ${years} ${(years > 1 ? "years" : "year")}! Glad you're with us!`);

                        } catch (e) { u.errorHandler(e, "Announce Cake Day Error"); continue; }
                    }
                    await guild.channels.cache.get(snowflakes.channels.general).send(`:birthday: :confetti_ball: :tada: Happy Cake Day, ${member}! :tada: :confetti_ball: :birthday:`);
                    u.addRoles(guild.members.cache.get(Module.client.user.id), member, snowflakes.roles.CakeDay);
                }
                else if (member.roles.cache.has(snowflakes.roles.CakeDay)) {
                    u.addRoles(guild.members.cache.get(Module.client.user.id), member, snowflakes.roles.CakeDay, true);
                }
            } catch (e) { u.errorHandler(e, "Birthay Send"); continue; }
        }
    } catch (e) { u.errorHandler(e, "cakeOrJoinDay Error"); }
}


Module
    .addCommand({
        name: "happycakeOrJoinDay",
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
    }).addCommand({
        name: "cakeOrJoinDay",
        description: "Let us know when to celebrate you",
        syntax: "Month/Day", hidden: true,
        process: async (msg, suffix) => {

            let member = msg.author;
            if (msg.mentions.users.size && (msg.member.roles.cache.has(snowflakes.roles.Admin) || (msg.member.roles.cache.has(snowflakes.roles.Whisper) || (msg.member.roles.cache.has(snowflakes.roles.SoaringWings))))) {
                member = (await msg.guild.members.fetch(msg.mentions.users.first().id)).user;
                suffix = suffix.replace(/<+.*>\s*/gm, "");
            }
            suffix = suffix.trim();
            try {
                let bd = new Date(suffix);
                if (bd == 'Invalid Date') {
                    msg.reply("I couldn't understand that date. Please use Month Day format (e.g. Apr 1 or 4/1).");

                    return;
                } else {
                    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
                    suffix = months[bd.getMonth()] + " " + bd.getDate();
                }
            } catch (e) {
                msg.reply("I couldn't understand that date. Please use Month Day format (e.g. Apr 1 or 4/1).");

                return;
            }
            db.User.update(Module, { userID: member.id, cakeDay: suffix })
            msg.react("🎂");

        },
        permissions: (msg) => true
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
                        await db.User.updateCakeDay(Module, cakeOrJoinDayUpdateTarget, cakeOrJoinDayDate);
                        return interaction.reply({ content: "🎂", ephemeral: true });
                    }
                } catch (e) {
                
                    interaction.reply({ content: "It seems couldn't understand that date. Please use Month Day format (e.g. Apr 1 or 4/1).", ephemeral: true });
                    throw e;
                    return;
                }
            } else if (target && !cakeOrJoinDayDate) {
                let targetBd = await db.User.get(target.id)
                if(!targetBd) targetBd = await db.User.new(Module, target.id);
                targetBd = targetBd.cakeDay
                return interaction.reply({ content: `<@${target.id}>'s cake day is ${targetBd}`, ephemeral: true })
            } else {
                let userCake = await db.User.get(interaction.member.id)
                if (!userCake) {
                    return interaction.reply({ content: "You haven't told me when your cakeDay is yet. To set it, use `/cakeday date`", ephemeral: true });
                } else return interaction.reply({ content: "Your cakeday is " + userCake.cakeDay + "! to reset it, use `/cakeday date`", ephemeral: true })

            }
        }
    })

module.exports = Module;
