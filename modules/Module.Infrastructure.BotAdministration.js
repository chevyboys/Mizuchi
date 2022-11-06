//This file is a place for all the publicly visable bot diagnostic commands usable primarily only by the head bot dev.

const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const snowflakes = require('../config/snowflakes.json');
const db = require("../utils/Utils.Database");

const Module = new Augur.Module()
  .addCommand({
    name: "gotobed",
    description: "The gotobed command shuts down the bot. This is good for a quick test for things !reload doesn't cover.", //It is reccomended to be used in conjunction with forever.js so the bot automatically restarts
    category: "Bot Admin",
    hidden: true,
    aliases: ["q", "restart"],
    process: async function (msg) {
      try {
        await msg.react("🛏");
        await msg.client.destroy();
        process.exit();
      } catch (e) { u.errorHandler(e, msg); }
    },
    permissions: (msg) => Module.config.AdminIds.includes(msg.author.id)
  })
  .addCommand({
    name: "ping",
    category: "Bot Admin",
    description: "Gets the current total ping time for the bot.",
    hidden: true,
    permissions: (msg) => (msg.author.id === Module.config.ownerId) || msg.member?.roles.cache.some(r => [Module.config.roles.mod, Module.config.roles.management, Module.config.roles.team].includes(r.id)),
    process: async (msg) => {
      let sent = await msg.reply({ content: 'Pinging...', allowedMentions: { repliedUser: false } });
      sent.edit({ content: `Pong! Took ${sent.createdTimestamp - (msg.editedTimestamp ? msg.editedTimestamp : msg.createdTimestamp)}ms`, allowedMentions: { repliedUser: false } });
    }
  })
  .addCommand({
    name: "emoji",
    category: "Bot Admin",
    description: "Shows all custom emoji in the server where it is used",
    hidden: true,
    permissions: (msg) => (msg.author.id === Module.config.ownerId) || msg.member.roles.cache.has(snowflakes.roles.BotMaster),
    process: async (msg) => {
      emoji = msg.guild.emojis.cache.map(e => e.toString() + "`" + e.toString() + "`");
      let arrayOfMessagesToSend = [];
      while (emoji.join("\n").length > 800) {
        let thisMessageToSend = [];
        for (let index = 0; thisMessageToSend.join("\n").length < 800; index++) {
          thisMessageToSend.push(emoji.shift())
        }
        arrayOfMessagesToSend.push(thisMessageToSend);

      }
      arrayOfMessagesToSend.push(emoji)
      for (const message of arrayOfMessagesToSend) {
        await msg.channel.send(message.join("\n"));
      }
    }
  }).addCommand({
    name: "roleid",
    category: "Bot Admin",
    description: "gets the id for a role based on name",
    hidden: true,
    permissions: (msg) => (msg.author.id === Module.config.ownerId) || msg.member.roles.cache.has(snowflakes.roles.BotMaster),
    process: async (msg, suffix) => {
      let roles = msg.guild.roles.cache.map((r) => { return { name: r.name.trim().toLowerCase().replaceAll(" ", ""), id: r.id } }).filter(r => suffix.trim().toLowerCase().replaceAll(" ", "").indexOf(r.name) > -1 || r.name.indexOf(suffix.trim().toLowerCase().replaceAll(" ", "")) > -1).map(r => `${r.name} : ${r.id}`);
      msg.reply(roles.length > 0 ? roles.join("\n") : "I can't find that role");
    }
  })
  .addCommand({
    name: "git",
    category: "Bot Admin",
    description: "git pull or git stash",
    hidden: true,
    process: (msg, suffix) => {
      let spawn = require("child_process").spawn;

      u.clean(msg);

      let cmd;
      if (suffix.toLowerCase().indexOf("pull") > -1) {
        cmd = spawn("git", ["pull"], { cwd: process.cwd() });
      }
      else if (suffix.indexOf("stash") > -1) {
        cmd = spawn("git", ["stash"], { cwd: process.cwd() });
      }

      let stdout = [];
      let stderr = [];

      cmd.stdout.on("data", data => {
        stdout.push(data);
      });

      cmd.stderr.on("data", data => {
        stderr.push(data);
      });

      cmd.on("close", code => {
        if (code == 0)
          msg.channel.send(stdout.join("\n") + "\n\nCompleted with code: " + code).then(u.clean);
        else
          msg.channel.send(`ERROR CODE ${code}:\n${stderr.join("\n")}`).then(u.clean);
      });
    },
    permissions: (msg) => (Module.config.ownerId === (msg.author.id))
  })
  .addCommand({
    name: "reload",
    category: "Bot Admin",
    hidden: true,
    syntax: "[file1.js] [file2.js]",
    description: "This command reloads one or more modules. Good for loading in small fixes.",
    info: "Use the command without a suffix to reload all Module files.\n\nUse the command with the module name (including the `.js`) to reload a specific file.",
    parseParams: true,
    process: (msg) => {
      u.clean(msg);
      const fs = require("fs");
      let files = fs.readdirSync('./modules/').filter(file => file.endsWith(".js"));
      for (const file of files) {
        try {
          msg.client.moduleHandler.reload('./modules/' + file);
        } catch (error) { msg.client.errorHandler(error, msg); }
      }
      msg.react("👌").catch(u.noop);
    },
    permissions: (msg) => Module.config.AdminIds.includes(msg.author.id)
  }).addCommand({
    name: "dbgetall",
    category: "Bot Admin",
    hidden: true,
    description: "This command loops through all members in the guild and attempts to add them to the database",
    parseParams: true,
    process: async (msg) => {
      u.clean(msg, 0);
      return msg.guild.members.cache.map(m => db.User.new(m.id));
    },
    permissions: (msg) => Module.config.AdminIds.includes(msg.author.id)
  })

  .addEvent("ready", () => {
    //When the bot is fully online, fetch all the discord members, since it will only autofetch for small servers and we want them all.
    Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).members.fetch();

  }).addEvent("guildMemberUpdate", async (oldMember, newMember) => {
    if (newMember.guild.id == snowflakes.guilds.PrimaryServer) {
      if (newMember.roles.cache.size > oldMember.roles.cache.size) {
        // Role added
        try {
          await db.User.updateRoles(newMember);
        } catch (error) { u.errorHandler(error, "Update Roles on Role Add"); }
      } else if (newMember.roles.cache.size < oldMember.roles.cache.size) {
        // Role removed
        try {
          await db.User.updateRoles(newMember);
        } catch (error) { u.errorHandler(error, "Update Roles on Role Remove"); }
      }
    }
  })
  //each time this module is loaded, update the module.config snowflakes.
  .setInit(async (reload) => {
    //Connect to the DB as well, and set up the DB.utils file
    db.init(Module);
    try {
      if (!reload) {
        u.errorLog.send({ embeds: [u.embed().setColor("BLUE").setDescription("Login successful. Intializing, please wait.")] });
      }
    } catch (e) {
      u.errorHandler(e, "Error in botAdmin.setInit.");
    }
  })
  //Database Keep alive
  .setClockwork(() => {
    const secondsInAMinute = 60
    const secondsInAnHour = 60 * secondsInAMinute;
    const hours = 6
    try {
      return setInterval(async () => {
        //SQL will time out if we don't send a keep alive. In order to do this, we will get the bot from the database, and have it overwrite its own entry with identical data
        let myself = await db.User.get(Module.client.user.id);
        await db.User.updateCakeDay(myself.userID, myself.cakeDay);
      }, hours * secondsInAnHour * 1000);
    } catch (error) { u.errorHandler(error, "Blog Clockwork"); }
  })
  .setUnload(() => true);

module.exports = Module;
