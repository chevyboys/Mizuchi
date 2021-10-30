/* This category is for commands useable by everyone that give information about the bot or specifically aid in the bots ability to be run on the server.
*/ 
const fs = require('fs');
const Augur = require("augurbot");
const u = require("../utils/utils");
const moment = require("moment");

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
                embed .setColor(msg.guild ? msg.guild.members.cache.get(msg.client.user.id).displayHexColor : "000000")
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
                                 await msg.author.send({ embed });
                            } catch (e) {
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
                    await msg.author.send({ embed });
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
                         await msg.author.send({ embed });
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
        name: "ping", // required
        aliases: ["beep", "ding", "yeet"], // optional
        syntax: "", // optional
        description: "Checks to see if the bot is online, and what the current response time is.", // recommended
        info: "", // recommended
        hidden: false, // optional
        category: "Bot Meta", // optional
        enabled: true, // optional
        permissions: (msg) => true, // optional
        process: (msg, suffix) => {
            //u.preCommand(msg);
            let pong;
            let { command } = u.parse(msg);
            if (command.toLowerCase() == "beep") {
                pong = "Boop";
            }
            else if (command.toLowerCase() == "yeet") {
                pong = "Yoink";
            }
            else pong = u.properCase(command.replace(/ing/gi, "ong"));
            msg.channel.send(`${command}ing...`).then(sent => {
                sent.edit(`${pong}! Took ${sent.createdTimestamp - (msg.editedTimestamp ? msg.editedTimestamp : msg.createdTimestamp)}ms`);
            });
            //u.postCommand(msg);
        } // required
    });

module.exports = Module;