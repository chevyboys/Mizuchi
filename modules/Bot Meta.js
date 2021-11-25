/* This category is for commands useable by everyone that give information about the bot or specifically aid in the bots ability to be run on the server.
*/
const fs = require('fs');
const Augur = require("augurbot");
const u = require("../utils/utils");
const moment = require("moment");
const axios = require("axios").default;
const snowflakes = require('../config/snowflakes.json');

async function sendDiscordStatus(msg, embed, verbose) {
    try {
        let discordStatus = await axios.get("https://srhpyqt94yxb.statuspage.io/api/v2/summary.json");
        let incidents = discordStatus.data.incidents;
        discordStatus = discordStatus.data.components;
        for (const component of discordStatus) {
            if (component.status != "operational" || verbose) {
                let emoji;
                switch (component.status) {
                    case "operational":
                        emoji = "🟢"
                        break;
                    case "partial_outage":
                        emoji = "🟡";
                        break;
                    case "major_outage":
                        emoji = "🟠";
                    default:
                        emoji = "🔴";
                        break;
                }
                embed.addField(`${emoji} ${component.name}`, `**Status**: ${component.status}`, true);
            }
        }
        for (const incident of incidents) {
            if (incident.resolved_at == null) {
                embed.addField(`❗__${incident.name}__❗`, `**Status**: ${incident.status}\n**Impact:** ${incident.impact}\n**Last Update:** ${incident.incident_updates[0].updated_at} \n\t${incident.incident_updates[0].body}`);

            }
        }
    } catch (error) {
        embed.addField(`Discord Components:`, `Unavailable`);
        u.errorLog(error);
    }
    msg.channel.send({ embeds: [embed] });
}

const Module = new Augur.Module()
    .addCommand({
        name: "help",
        description: "Get a list of available commands or more indepth info about a single command.",
        syntax: "[command name]",
        category: "Bot Meta", // optional
        aliases: ["commands"],
        process: async (msg, suffix) => {
            //u.preCommand(msg);
            msg.react("👌");
            u.clean(msg);
            let prefix = Module.config.prefix;
            let commands = Module.client.commands.filter(c => c.permissions(msg) && c.enabled);
            let embed = u.embed()
                .setColor(msg.guild.members.cache.get(msg.client.user.id).displayHexColor)
                .setThumbnail(msg.client.user.displayAvatarURL({ size: 128 }));

            if (!suffix) { // FULL HELP
                embed.setColor(msg.guild ? msg.guild.members.cache.get(msg.client.user.id).displayHexColor : "000000")
                    .setTitle(msg.client.user.username + " Commands" + (msg.guild ? ` in ${msg.guild.name}.` : "."))
                    .setDescription(`You have access to the following commands. For more info, type \`${prefix}help <command>\`.`);
                let categories;
                if (Module.config.adminId.includes(msg.author.id)) {
                    categories = commands
                        .filter(c => c.category != "General")
                        .map(c => c.category)
                        .reduce((a, c, i, all) => ((all.indexOf(c) == i) ? a.concat(c) : a), [])
                        .sort();
                }
                else {
                    categories = commands
                        .filter(c => !c.hidden && c.category != "General")
                        .map(c => c.category)
                        .reduce((a, c, i, all) => ((all.indexOf(c) == i) ? a.concat(c) : a), [])
                        .sort();
                }

                categories.unshift("General");

                let i = 1;
                for (let category of categories) {
                    if ((category == "Bot Admin" && msg.client.config.adminId.includes(msg.author.id)) || category != "Bot Admin" && category != "General" && category != "Server Admin" || (category == "Server Admin" && msg.channel.permissionsFor(msg.member).has(["MANAGE_MESSAGES", "MANAGE_CHANNELS"]))) {
                        embed.addField(`🔲🔲🔲◾${category}◾🔲🔲🔲`, `᲼`);
                    }
                    for (let [name, command] of commands.filter(c => c.category == category && (!c.hidden || msg.client.config.adminId.includes(msg.author.id))).sort((a, b) => a.name.localeCompare(b.name))) {
                        embed.addField(prefix + command.name + " " + command.syntax, (command.description ? command.description : "Description"));
                        if (i == 20) {
                            try {
                                await msg.author.send({ embeds: [embed] });
                            } catch (e) {
                                u.errorHandler(e);
                                msg.channel.send("I couldn't send you a DM. Make sure that `Allow direct messages from server members` is enabled under the privacy settings, and that I'm not blocked.").then(u.clean);
                                return;
                            }
                            embed = u.embed().setTitle(msg.client.user.username + " Commands" + (msg.guild ? ` in ${msg.guild.name}.` : ".") + " (Cont.)")
                                .setColor(msg.guild ? msg.guild.members.cache.get(msg.client.user.id).displayHexColor : "000000")
                                .setDescription(`You have access to the following commands. For more info, type \`${prefix}help <command>\`.`);
                            i = 0;
                        }
                        i++;
                    }
                    if ((category == "Bot Admin" && msg.client.config.adminId.includes(msg.author.id)) || category != "Bot Admin" && category != "General") {
                        embed.addField(`᲼`, `᲼`);
                    }
                }
                try {
                    await msg.author.send({ embeds: [embed] });
                } catch (e) {
                    msg.channel.send("I couldn't send you a DM. Make sure that `Allow direct messages from server members` is enabled under the privacy settings, and that I'm not blocked.").then(u.clean);
                    return;
                }
            } else { // SINGLE COMMAND HELP
                let command = null;
                if (commands.has(suffix)) command = commands.get(suffix);
                else if (Module.client.commands.aliases.has(suffix)) command = Module.client.commands.aliases.get(suffix);
                if (command) {
                    embed
                        .setTitle(prefix + command.name + " help")
                        .setDescription(command.info)
                        .addField("Category", command.category)
                        .addField("Usage", prefix + command.name + " " + command.syntax);

                    if (command.aliases.length > 0) embed.addField("Aliases", command.aliases.map(a => `!${a}`).join(", "));
                    try {
                        await msg.author.send({ embeds: [embed] });
                    } catch (e) {
                        msg.channel.send("I couldn't send you a DM. Make sure that `Allow direct messages from server members` is enabled under the privacy settings, and that I'm not blocked.").then(u.clean);
                        return;
                    }
                } else {
                    msg.reply("I don't have a command by the name of \"" + suffix + "\".").then(u.clean);
                }
            }
            //u.postCommand(msg);
        }
    }).addCommand({
        name: "playing",
        category: "Bot Admin",
        hidden: true,
        description: "Set playing status",
        syntax: "[game]",
        aliases: ["streaming", "watching", "listening"],
        process: (msg, suffix) => {//msg.client.user.setActivity(suffix);
            if (suffix) {
                let { command } = u.parse(msg);
                command = command.toUpperCase();
                let url = false;
                if (command == "STREAMING") {

                    //detect if URL
                    const args = suffix.trim().split(/s/);
                    //Determine if a string is a url
                    function isURL(str) {
                        const urlMatch = /<?(https?:\/\/\S+)>?/;
                        const match = urlMatch.exec(str);
                        return match ? match[1] : null;
                    }
                    url = isURL(suffix);
                    msg.client.user.setActivity({ type: command.toUpperCase(), url: url, name: suffix.replace(url, "").replace("  ", " ").trim() });
                }
                else msg.client.user.setActivity({ type: command.toUpperCase(), name: suffix })
                
            }
            else msg.client.user.setActivity("");
            msg.react("👌");
        },
        permissions: (msg) => (Module.config.adminId.includes(msg.author.id) || Module.config.ownerId == msg.author.id || msg.member.roles.cache.has(snowflakes.roles.Admin))
    }).addCommand({
        name: "say",
        syntax: "<stuff>",
        aliases: [], // optional
        category: "Fun",
        hidden: true,
        process: (msg, suffix) => {
            if (msg.deletable && (suffix.indexOf("-x") > -1) && (msg.client.config.adminId.includes(msg.author.id) || msg.client.config.ownerId == msg.author.id)) msg.delete();
            msg.channel.send(suffix.replace("-x", ""));
        },
        permissions: (msg) => msg.member.roles.cache.has(snowflakes.roles.BotMaster),
    })
    .addCommand({
        name: "pulse",
        category: "Bot Admin",
        hidden: true,
        description: "Check the bot's heartbeat",
        permissions: (msg) => (Module.config.ownerId === (msg.author.id)),
        process: async function (msg, suffix) {
            try {
                let client = msg.client;

                let embed = u.embed()
                    .setColor(msg.guild ? msg.guild.members.cache.get(msg.client.user.id).displayHexColor : "000000")
                    .setAuthor(client.user.username + " Heartbeat", client.user.displayAvatarURL())
                    .setTimestamp();

                if (client.shard) {
                    let guilds = await client.shard.fetchClientValues('guilds.cache.size');
                    guilds = guilds.reduce((prev, val) => prev + val, 0);
                    let channels = client.shard.fetchClientValues('channels.cache.size')
                    channels = channels.reduce((prev, val) => prev + val, 0);
                    let mem = client.shard.broadcastEval("Math.round(process.memoryUsage().rss / 1024 / 1000)");
                    mem = mem.reduce((t, c) => t + c);
                    embed
                        .addField("Shards", `Id: ${client.shard.id}\n(${client.shard.count} total)`, true)
                        .addField("Total Bot Reach", `${guilds} Servers\n${channels} Channels`, true)
                        .addField("Shard Uptime", `${Math.floor(client.uptime / (24 * 60 * 60 * 1000))} days, ${Math.floor(client.uptime / (60 * 60 * 1000)) % 24} hours, ${Math.floor(client.uptime / (60 * 1000)) % 60} minutes`, true)
                        .addField("Shard Commands Used", `${client.commands.commandCount} (${(client.commands.commandCount / (client.uptime / (60 * 1000))).toFixed(2)}/min)`, true)
                        .addField("Total Memory", `${mem}MB`, true);
                    sendDiscordStatus(msg, embed, (suffix.indexOf('verbose') > -1));
                } else {
                    let uptime = process.uptime();
                    embed
                        .addField("Uptime", `Discord: ${Math.floor(client.uptime / (24 * 60 * 60 * 1000))} days, ${Math.floor(client.uptime / (60 * 60 * 1000)) % 24} hours, ${Math.floor(client.uptime / (60 * 1000)) % 60} minutes\nProcess: ${Math.floor(uptime / (24 * 60 * 60))} days, ${Math.floor(uptime / (60 * 60)) % 24} hours, ${Math.floor(uptime / (60)) % 60} minutes`, true)
                        .addField("Reach", `${client.guilds.cache.size} Servers\n${client.channels.cache.size} Channels\n${client.users.cache.size} Users`, true)
                        .addField("Commands Used", `${client.commands.commandCount} (${(client.commands.commandCount / (client.uptime / (60 * 1000))).toFixed(2)}/min)`, true)
                        .addField("Memory", `${Math.round(process.memoryUsage().rss / 1024 / 1000)}MB`, false);
                    sendDiscordStatus(msg, embed, (suffix.indexOf('verbose') > -1));
                }
            } catch (e) { u.errorHandler(e, msg); }
        }
    });

module.exports = Module;