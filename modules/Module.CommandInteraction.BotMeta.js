/* This category is for commands useable by everyone that give information about the bot or specifically aid in the bots ability to be run on the server.
*/
const Augur = require("augurbot");
const u = require("../utils/Utils.Generic");
const axios = require("axios").default;
const snowflakes = require('../config/snowflakes.json');
const config = require("../config/config.json");
let previousDiscordIncident;

/*function isURL(str) {
  const urlMatch = /<?(https?:\/\/\S+)>?/;
  const match = urlMatch.exec(str);
  if (str.indexOf("youtube") > -1 || str.indexOf("twitch") > -1) return match ? match[1] || match[0] : null;
  else return null;
}*/

async function setBotStatus({ clientuser, type, status, url }) {
  clientuser.setActivity({ type: type.toUpperCase(), url: url, name: status.trim() });

}
/**
 * Sends discord's current status as reported by the discord API
 * @param {(Discord.Message|Discord.Interaction)} interaction the interaction that this is responding to
 * @param {Discord.MessageEmbed} [embed] the embed to add the needed fields to.
 * @param {boolean} [verbose=false] weather or not to display the current status about all discord api services
 * @returns {Discord.MessageOptions}
 */
async function sendDiscordStatus(interaction, embed, verbose = false) {
  if (!embed) embed = u.embed({ color: (interaction.guild ? interaction.guild.members.cache.get(interaction.client.user.id).displayHexColor : "000000"), author: (interaction.client.user.username + " Heartbeat", interaction.client.user.displayAvatarURL()), description: "Discord Current Status:" });
  embed.setTimestamp()
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
            break;
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
  return { embeds: [embed], ephemeral: true };
}

async function getBotStatus(interaction, verbose = false) {
  try {
    let client = interaction.client;

    let embed = u.embed()
      .setColor(interaction.guild ? interaction.guild.members.cache.get(interaction.client.user.id).displayHexColor : "000000")
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
    } else {
      let uptime = process.uptime();
      embed
        .addField("Uptime", `Discord: ${Math.floor(client.uptime / (24 * 60 * 60 * 1000))} days, ${Math.floor(client.uptime / (60 * 60 * 1000)) % 24} hours, ${Math.floor(client.uptime / (60 * 1000)) % 60} minutes\nProcess: ${Math.floor(uptime / (24 * 60 * 60))} days, ${Math.floor(uptime / (60 * 60)) % 24} hours, ${Math.floor(uptime / (60)) % 60} minutes`, true)
        .addField("Reach", `${client.guilds.cache.size} Servers\n${client.channels.cache.size} Channels\n${client.users.cache.size} Users`, true)
        .addField("Commands Used", `${client.commands.commandCount} (${(client.commands.commandCount / (client.uptime / (60 * 1000))).toFixed(2)}/min)`, true)
        .addField("Memory", `${Math.round(process.memoryUsage().rss / 1024 / 1000)}MB`, false);

    }
    interaction.reply(await sendDiscordStatus(interaction, embed, verbose));
  } catch (e) { u.errorHandler(e, interaction); }
}
const Module = new Augur.Module()
async function alertDiscordStatus(override) {
  let discordStatus = await axios.get("https://srhpyqt94yxb.statuspage.io/api/v2/summary.json");
  let incidents = discordStatus.data.incidents;
  if (!override) return;
  if ((incidents.length < 1 || incidents == previousDiscordIncident)) return;
  previousDiscordIncident = incidents;
  let fakeInteraction = { guild: Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer), client: Module.client, };
  let channel = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.cache.get(snowflakes.channels.earthTemple);
  let msgOptions = await sendDiscordStatus(fakeInteraction)
  msgOptions.content = `<@${Module.config.ownerId}><@398556120714706956>\n**Warning: Discord Status API reports ongoing issues**`
  msgOptions.allowedMentions = { parse: ["users"] },
    await channel.send(msgOptions);
}

Module
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
        if (config.AdminIds.includes(msg.author.id)) {
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

        let guild = msg.guild || msg.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
        let member = await guild.members.fetch(msg.author.id);
        let roles = await member.roles.cache;
        let hasAdmin = roles.has(snowflakes.roles.BotMaster) || roles.has(snowflakes.roles.BotAssistant) || Module.config.AdminIds.includes(msg.author.id) || Module.config.ownerId == msg.author.id;

        for (let category of categories) {
          let fields = [];
          let i = 0;
          for (let [name, command] of commands.filter(c => c.category == category && (!c.hidden || msg.client.config.AdminIds.includes(msg.author.id) || hasAdmin)).sort((a, b) => a.name.localeCompare(b.name))) {
            fields.push({ name: prefix + command.name + " " + command.syntax, value: (command.description ? command.description : "Description") });
            i++;
            if (i >= 20) {
              let embed = u.embed()
                .setColor(msg.guild.members.cache.get(msg.client.user.id).displayHexColor)
                .setThumbnail(msg.client.user.displayAvatarURL({ size: 128 }))
                .setTitle(category + " Commands" + (msg.guild ? ` in ${msg.guild.name}.` : "."))
                .setFields(fields);
              try {
                await msg.author.send({ content: category, embeds: [embed] });
              } catch (e) {
                msg.channel.send("I couldn't send you a DM. Make sure that `Allow direct messages from server members` is enabled under the privacy settings, and that I'm not blocked.").then(u.clean);
                return;
              }
              fields = [];
              i = 0;
            }
          }
          let embed = u.embed()
            .setColor(msg.guild.members.cache.get(msg.client.user.id).displayHexColor)
            .setThumbnail(msg.client.user.displayAvatarURL({ size: 128 }))
            .setTitle(category + " Commands" + (msg.guild ? ` in ${msg.guild.name}.` : "."))
            .setFields(fields);
          try {
            await msg.author.send({ content: category, embeds: [embed] });
          } catch (e) {
            msg.channel.send("I couldn't send you a DM. Make sure that `Allow direct messages from server members` is enabled under the privacy settings, and that I'm not blocked.").then(u.clean);
            return;
          }
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
  })
  .addCommand({
    name: "edit",
    category: "bot admin",
    hidden: true,
    description: "Edit a message by message id",
    syntax: "<message id> <new content>",
    process: async (msg, suffix) => {
      let args = suffix.split(" ");
      let id = args.shift();
      let newContent = args.join(" ");
      let message = await msg.channel.messages.fetch(id);
      if (message) {
        message.edit(newContent);
        msg.react("👌");
      } else {
        msg.reply("I couldn't find that message.").then(m => u.clean(m));
      }
      u.clean(msg);
    },
  })
  .addCommand({
    name: "delete",
    category: "bot admin",
    hidden: true,
    description: "Delete a message by message id",
    syntax: "<message id>",
    process: async (msg, suffix) => {
      let message = await msg.channel.messages.fetch(suffix);
      if (message) {
        message.delete();
        msg.react("👌")
      } else {
        msg.reply("I couldn't find that message.").then(m => u.clean(m));
      }
      u.clean(msg);
    },
  })
  .addCommand({
    name: "avatar",
    category: "Bot Admin",
    hidden: true,
    description: "set's the bot's avatar to an image of the same name as the message suffix",
    syntax: "[name]",
    process: (msg, suffix) => {
      msg.client.user.setAvatar(('./avatar/' + (suffix ? suffix.trim() : "base.png")))
      msg.react("👌");
    },
    permissions: (msg) => (Module.config.AdminIds.includes(msg.author.id) || Module.config.ownerId == msg.author.id || msg.member.roles.cache.has(snowflakes.roles.Admin) || msg.member.roles.cache.has(snowflakes.roles.BotMaster) || msg.member.roles.cache.has(snowflakes.roles.BotAssistant))
  }).addInteractionCommand({
    name: "status",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      console.log(JSON.stringify(interaction.options), 0, 2);
      let url = null
      if (url && interaction?.options?.get("type")?.value.toLowerCase().indexOf("stream") > -1) {
        url = interaction?.options?.get("url")?.value; //isURL(interaction?.options?.get("url")?.value);
        if (!url) return interaction.reply({ content: "That URL is not valid, streaming requires a valid youtube or twitch url", ephemeral: true })
      }
      await setBotStatus({
        clientuser: Module.client.user,
        type: interaction?.options?.get("type")?.value,
        status: interaction?.options?.get("status")?.value,
        url: interaction?.options?.get("url")?.value
      })

      return interaction.reply({ content: `The bot's status has been set to ${interaction?.options?.get("type")?.value} ${interaction?.options?.get("status")?.value}${interaction?.options?.get("url")?.value ? "\nfor the url " + interaction?.options?.get("url")?.value : ""}`, ephemeral: true })
    }

  })
  .addCommand({
    name: "say",
    syntax: "<stuff>",
    aliases: [], // optional
    category: "Fun",
    hidden: true,
    process: (msg, suffix) => {
      if (msg.deletable && (msg.client.config.AdminIds.includes(msg.author.id) || msg.client.config.ownerId == msg.author.id)) msg.delete();
      let files = msg.attachments ? Array.from(msg.attachments.values()).map(v => v.attachment) : null
      msg.channel.send({ content: suffix, embeds: msg.embeds, files: files, reply: { messageReference: msg.reference?.messageId || null } });
      u.errorHandler(msg.author.username + " in channel " + msg.channel?.name + " said: " + suffix);
    },
    permissions: (msg) => msg.member?.roles.cache.has(snowflakes.roles.BotMaster) || msg.member?.roles.cache.has(snowflakes.roles.BotAssistant) || msg.client.config.AdminIds.includes(msg.author.id) || msg.client.config.ownerId == msg.author.id
  })
  .addCommand({
    name: "pulse",
    category: "Bot Admin",
    hidden: true,
    description: "Check the bot's heartbeat",
    permissions: (msg) => (Module.config.ownerId === (msg.author.id)) || msg.member.roles.cache.has(snowflakes.roles.BotMaster) || msg.member.roles.cache.has(snowflakes.roles.BotAssistant),
    process: async function (msg, suffix) {
      if (suffix.indexOf('clockwork') > -1) {
        await alertDiscordStatus(true);
      } else await getBotStatus(msg, (suffix.indexOf('verbose') > -1));
    }
  })
  .addEvent("messageCreate", async (msg) => {
    for (const UpdateRole of Object.values(snowflakes.roles.Updates)) {
      if (msg.mentions.roles.has(UpdateRole) && !msg.mentions.roles.has(snowflakes.roles.Updates.AllUpdates)) {
        return msg.reply({ content: "<@&" + snowflakes.roles.Updates.AllUpdates + ">", allowedMentions: { roles: [snowflakes.roles.Updates.AllUpdates] } })
      }
    }
  })
  .addInteractionCommand({
    name: "pulse",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      await getBotStatus(interaction, interaction.options.getBoolean("verbose") || false)
    }
  });

Module.setClockwork(() => {
  try {
    return setInterval(alertDiscordStatus, 10 * 60 * 1000);
  } catch (e) { u.errorHandler(e, "cakeOrJoinDay Clockwork Error"); }
})

module.exports = Module;