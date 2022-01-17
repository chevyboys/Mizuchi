const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  db = require("../utils/Utils.Database"),
  snowflakes = require("../config/snowflakes.json")

const Module = new Augur.Module()
  .addEvent("guildMemberAdd", async (member) => {
    try {
      //Make sure we are in the primary server
      if (member.guild.id != snowflakes.guilds.PrimaryServer) return;


      //set up common variables we will need in a bit
      let guild = member.guild;
      let bot = member.client;

      let user = await db.User.get(member.id);
      let general = guild.channels.cache.get(snowflakes.channels.general); // #general
      let welcomeChannel = guild.channels.cache.get(snowflakes.channels.introductions); // #welcome
      let modLogs = guild.channels.cache.get(snowflakes.channels.modRequests); // #mod-logs
      let member = await guild.members.fetch(user.userID);




      //Notify Mods that a new user is here
      let embed = u.embed()
        .setColor(0x7289da)
        .setDescription("Account Created:\n" + member.user.createdAt.toLocaleDateString())
        .setTimestamp()
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));


      let welcomeString;

      if (user) { // Member is returning
        let toAdd = user.roles.filter(role => (
          guild.roles.cache.has(role) &&
          !guild.roles.cache.get(role).managed &&
          //put any roles we *don't* want to prompt for here
          ![].includes(role)
        ));
        if (user.roles.length > 0) u.addRoles(Module.client, member, toAdd);

        let roleString = member.roles.cache.sort((a, b) => b.comparePositionTo(a)).map(role => role.name).join(", ");
        if (roleString.length > 1024) roleString = roleString.substr(0, roleString.indexOf(", ", 1000)) + " ...";

        embed.setTitle(member.displayName + " has rejoined the server.")
          .addField("Roles", roleString);
        welcomeString = `Welcome back, ${member}! Glad to see you again.`;

      } else { // Member is new
        let welcome = [
          "Welcome",
          "Hi there",
          "Glad to have you here",
          "Ahoy"
        ];
        let info1 = [
          "Take a look at",
          "Check out",
          "Head on over to"
        ];
        let info2 = [
          "to get started",
          "for some basic community rules",
          "and join in the chat"
        ];
        let info3 = [
          "What brings you our way?",
          "How'd you find us?",
          "What platforms/games do you play?"
        ];
        welcomeString = `${u.rand(welcome)}, ${member}! ${u.rand(info1)} ${welcomeChannel} ${u.rand(info2)}. ${u.rand(info3)}\n\nTry \`!profile\` over in <#${Module.config.channels.botspam}> if you'd like to opt in to roles or share IGNs.`;
        embed.setTitle(member.displayName + " has joined the server.");

        db.User.new(Module, member);
      }
      modLogs.send({ embed });

      if (!member.user.bot)
        general.send(welcomeString);

    } catch (e) { u.errorHandler(e, "New Member Add"); }
  });

module.exports = Module;