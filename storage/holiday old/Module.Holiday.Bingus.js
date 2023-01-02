const snowflakes = require("../config/snowflakes.json");
const Augur = require("augurbot");
const Module = new Augur.Module;
const RoleClient = require("../utils/Utils.RolesLogin");
let roleGuild = RoleClient.guilds.cache.get(snowflakes.guilds.PrimaryServer);
let eventRunning = false;


Module.addEvent("messageCreate", async (msg) => {
  if (!roleGuild) {
    roleGuild = await RoleClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
  }
  if (!msg.author.bot && !eventRunning && msg.content?.toLowerCase().replaceAll(' ', "").indexOf('bymypower,bydivinepower') > -1 && (msg.author?.id == ("431220192128008192") || msg.author.id == "487085787326840843")) {
    const general = msg.guild.channels.cache.get(snowflakes.channels.general);
    const webhooks = await general.fetchWebhooks()
    let selys = webhooks.find(w => w.name.toLowerCase().indexOf("selys") > -1);
    if (!selys) {
      selys = await general.createWebhook('Selys', {
        avatar: './avatar/selysWebhook.png',
        reason: 'Holiday Event'
      })
        .then(sel => sel.send("My blessing is upon you.")).catch(err => { throw err });
    }
    else (await selys).send("My blessing is upon you.");
    eventRunning = true;
    const holiday = await roleGuild.roles.fetch(snowflakes.roles.Holiday);
    await holiday.setName("Blessed of the Bingus");
    await holiday.setColor("#C4CBFF")
    try {
      await holiday.setIcon("./avatar/blueStar.png")
    } catch (error) {
      try {
        await holiday.setIcon("./avatar/selysWebhook.png")
      } catch (error) {
        console.error(error)
      }
      console.error(error);
    }

  }
  else if (!eventRunning || msg.author.bot || !msg.member || msg.member.roles?.cache.has(snowflakes.roles.Holiday)) return;
  else {
    let member = await roleGuild.members.fetch(msg.member.id);

    try {
      member.roles.add(snowflakes.roles.Holiday);
      console.log("Added holiday role to " + msg.member.displayName)
    } catch (error) {
      const modRequests = msg.guild.channels.cache.get(snowflakes.channels.modRequests);
      modRequests.send("I couldn't add the <@&" + snowflakes.roles.Holiday + " role to " + msg.member.displayName)
      throw error;
    }
  }
})

module.exports = Module;