const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  db = require("../utils/Utils.Database"),
  snowflakes = require("../config/snowflakes.json")

  function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

const Module = new Augur.Module()
  .addEvent("messageCreate", async (msg) => {

    if(msg.type != "GUILD_MEMBER_JOIN" && !msg.author.bot) return;
    let member = await msg.guild.members.fetch(msg.author);
    try {
      //Make sure we are in the primary server
      if (member.guild.id != snowflakes.guilds.PrimaryServer) return;


      //set up common variables we will need in a bit
      let guild = member.guild;
      let bot = member.client;

      let user = await db.User.get(member.id);
      let general = guild.channels.cache.get(snowflakes.channels.introductions); // #introductions
      let welcomeChannel = guild.channels.cache.get(snowflakes.channels.introductions); // #welcome
      let modLogs = guild.channels.cache.get(snowflakes.channels.modRequests); // #mod-logs




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
          ![snowflakes.guilds.PrimaryServer].includes(role) &&
          !member.roles.cache.has(role)
        ));
        if (user.roles.length > 0) 
        try {
          u.addRoles(member, toAdd);
        } catch (err) {
          u.log (err);
        }
        //give other bots time to add roles if they are going to do so.
        await delay(3000);
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
          "Hello there",
          "Greetings"
        ];
        let info1 = [
          "I hope you brought pizza! \nTake a look at",
          "Take a peak at",
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
          "How far have you gotten in the books?"
        ];
        welcomeString = `${u.rand(welcome)}, ${member}! ${u.rand(info1)} <#${snowflakes.channels.rules}> ${u.rand(info2)}. ${u.rand(info3)}\n\nHead over to <#${snowflakes.channels.roles}> if you'd like to opt in to roles, and be sure to check out our FAQ and spoiler policy`;
        embed.setTitle(member.displayName + " has joined the server.");

        db.User.new(member);
      } 

      if (!member.user.bot)
        general.send({content: welcomeString, allowedMentions: {users: [member.user.id] }});
        u.noop();

    } catch (e) { u.errorHandler(e, "New Member Add"); }
  });

module.exports = Module;
