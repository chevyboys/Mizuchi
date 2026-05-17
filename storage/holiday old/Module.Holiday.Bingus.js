const Augur = require("augurbot");
const Module = new Augur.Module;
const RoleClient = require("../../utils/Utils.RolesLogin");
let roleGuild = null;
let eventRunning = false;


Module.setInit(async () => {
  roleGuild = await RoleClient.guilds.fetch(Module.config.snowflakes.guilds.PrimaryServer);
})
  .addEvent("messageCreate", async (msg) => {
    if (!roleGuild) {
      roleGuild = await RoleClient.guilds.fetch(Module.config.snowflakes.guilds.PrimaryServer);
    }
    if (!msg.author.bot && !eventRunning && msg.content?.toLowerCase().replaceAll(' ', "").indexOf('bymypower,bydivinepower') > -1 && (msg.author?.id == ("431220192128008192") || msg.author.id == "487085787326840843")) {
      const general = msg.guild.channels.cache.get(Module.config.snowflakes.channels.general);
      const webhooks = await general.fetchWebhooks()
      let selys = webhooks.find(w => w.name.toLowerCase().indexOf("selys") > -1);
      if (!selys) {
        selys = await general.createWebhook('Selys', {
          avatar: './avatar/Winter-selysWebhook.png',
          reason: 'Holiday Event'
        })
          .then(sel => sel.send("My blessing is upon you.")).catch(err => { throw err });
      }
      else (await selys).send("My blessing is upon you.");
      eventRunning = true;
      const holiday = await roleGuild.roles.fetch(Module.config.snowflakes.roles.Holiday[0]);
      await holiday.setName("Blessed of the Bingus");
      await holiday.setColor("#C4CBFF")
      try {
        await holiday.setIcon("./avatar/blueStar.png")
      } catch (error) {
        try {
          await holiday.setIcon("./avatar/Winter-selysWebhook.png")
        } catch (error) {
          console.error(error)
        }
        console.error(error);
      }

    }
    else if (!eventRunning || msg.author.bot || !msg.member || msg.member.roles?.cache.has(Module.config.snowflakes.roles.Holiday)) return;
    else {
      let member = await roleGuild.members.fetch(msg.member.id);

      try {
        member.roles.add(Module.config.snowflakes.roles.Holiday);
        console.log("Added holiday role to " + msg.member.displayName)
      } catch (error) {
        const modRequests = msg.guild.channels.cache.get(Module.config.snowflakes.channels.modRequests);
        modRequests.send("I couldn't add the <@&" + Module.config.snowflakes.roles.Holiday + " role to " + msg.member.displayName)
        throw error;
      }
    }
  })

module.exports = Module;