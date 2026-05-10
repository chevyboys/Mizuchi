//This file is a place for all the publicly visable bot diagnostic commands usable primarily only by the head bot dev.

const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
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
    permissions: (msg) => Module.config.AdminIds.includes(msg.author.id) || msg.member.roles.cache.has(snowflakes.roles.BotMaster) || msg.member.roles.cache.has(snowflakes.roles.BotAssistant)
  })
  .addCommand({
    name: "ping",
    category: "Bot Admin",
    description: "Gets the current total ping time for the bot.",
    hidden: true,
    permissions: (msg) => (msg.author.id === Module.config.ownerId) || msg.member?.roles.cache.some(r => [snowflakes.roles.Moderator, snowflakes.roles.Admin, snowflakes.roles.CommunityGuide, snowflakes.roles.BotAssistant, snowflakes.roles.BotMaster].includes(r.id)),
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
    permissions: (msg) => (msg.author.id === Module.config.ownerId) || msg.member.roles.cache.has(snowflakes.roles.BotMaster) || msg.member.roles.cache.has(snowflakes.roles.BotAssistant),
    process: async (msg) => {
      let emoji = msg.guild.emojis.cache.map(e => e.toString() + "`" + e.toString() + "`");
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
    permissions: (msg) => (msg.author.id === Module.config.ownerId) || msg.member.roles.cache.has(snowflakes.roles.BotMaster) || msg.member.roles.cache.has(snowflakes.roles.BotAssistant),
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
        cmd = spawn("git", ["pull", "origin", "main"], { cwd: process.cwd() });
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
    permissions: (msg) => Module.config.AdminIds.includes(msg.author.id) || msg.member?.roles.cache.has(snowflakes.roles.BotMaster) || msg.member.roles.cache.has(snowflakes.roles.BotAssistant) || msg.member?.roles.cache.has(snowflakes.roles.Admin)
  }).addCommand({
    name: "dbgetall",
    category: "Bot Admin",
    hidden: true,
    description: "This command loops through all members in the guild and syncs them to the new database",
    parseParams: true,
    process: async (msg) => {
      try {
        // 1. Give visual feedback that a long process has started
        await msg.react("⏳");

        await db.Guild.get(msg.guild.id); // Ensure the guild is in the database

        const rolesToSync = [];
        for (const role of msg.guild.roles.cache.values()) {
          if (!role.managed) {
            rolesToSync.push(new db.DBGuildRoleObject({
              snowflake: role.id,
              friendly_name: role.name,
              has_redacted_info: false,
              is_update_role: false
            }));
          }
        }

        msg.react("1️⃣");

        await db.Guild.update_roles(msg.guild.id, rolesToSync);

        const members = msg.guild.members.cache;
        msg.react("2️⃣");

        let successCount = 0;
        let errorCount = 0;

        // Reply with progress, updating as we go to give feedback on duration
        const progressMessage = await msg.reply(`Syncing database: 0/${members.size} members synced. Errors: 0`);
        let numberOfMembersProcessed = 0;

        // 2. The Mass Sync Loop
        for (const [id, m] of members) {
          if (numberOfMembersProcessed % 100 === 0) {
            await progressMessage.edit(`Syncing database: ${successCount}/${members.size} members synced. Errors: ${errorCount}`);
            // Sleep for half a second to avoid hitting rate limits and to give the bot a chance to breathe
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          try {
            await db.User.sync_roles(m);
            successCount++;
          } catch (err) {
            console.error(`Failed to sync user ${id} (${m.user.tag}):`, err);
            errorCount++;
          }

          numberOfMembersProcessed++;
        }

        console.log(`Database sync complete! Synced ${successCount} members. Errors: ${errorCount}`);

        // 3. Cleanup and final reporting
        await msg.reactions.removeAll().catch(() => { }); // Clear the hourglass
        await msg.react("🎚"); // Add the original success reaction

        // Send a temporary status report
        const reply = await msg.reply(`Database sync complete! Synced **${successCount}** members. (Errors: ${errorCount})`);
        u.clean(reply, 10000);
        u.clean(msg, 10000);

      } catch (globalError) {
        console.error("Critical error in dbgetall command:", globalError);
        msg.reply("A critical error occurred while syncing the database. Check the console.");
      }
    },
    permissions: (msg) => Module.config.AdminIds.includes(msg.author.id) || msg.member.roles.cache.has(snowflakes.roles.BotMaster)
  })

  .addEvent("ready", () => {
    //When the bot is fully online, fetch all the discord members, since it will only autofetch for small servers and we want them all.
    Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).members.fetch();
    u.setClient(Module.client);
  }).addEvent("guildMemberUpdate", async (oldMember, newMember) => {
    if (newMember.guild.id == snowflakes.guilds.PrimaryServer) {
      let dbUser = await db.User.get(newMember.id, newMember.guild.id);
      if (!dbUser) dbUser = await db.User.new(newMember.id, newMember.guild.id);
      if (newMember.roles.cache.size > oldMember.roles.cache.size) {
        // Role added
        try {
          await dbUser.updateRoles(newMember.guild.id);
        } catch (error) { u.errorHandler(error, "Update Roles on Role Add"); }
      } else if (newMember.roles.cache.size < oldMember.roles.cache.size) {
        // Role removed
        try {
          await dbUser.updateRoles(newMember.guild.id);
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
        let myself = await db.User.get(Module.client.user.id, Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).id);
        await db.User.updateCakeDay(myself.snowflake, myself.cakeDay);
      }, hours * secondsInAnHour * 1000);
    } catch (error) { u.errorHandler(error, "Blog Clockwork"); }
  })
  .setUnload(() => true);

module.exports = Module;
