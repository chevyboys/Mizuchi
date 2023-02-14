const snowflakes = require("../config/snowflakes.json");
const Augur = require("augurbot");
const Module = new Augur.Module;
const RoleClient = require("../utils/Utils.RolesLogin");
let roleGuild = RoleClient.guilds.cache.get(snowflakes.guilds.PrimaryServer);
let eventRunning = false;
let shouldUpdateColor = true;

const u = require("../utils/Utils.Generic")

const colors = ["#C00000", "#FF3334", "#FF0000", "#FF6F77", "#FFBBC1", "#e4adff", "#FFDEE3", "#FF8896", "#FC245C", "#FC8CB4", "#820123", "#960228"]
async function updateColor() {
  if (!eventRunning || !shouldUpdateColor) return;
  const holiday = await roleGuild.roles.fetch(snowflakes.roles.Holiday);
  try {
    let item = colors[Math.floor(Math.random() * colors.length)];
    await holiday.setColor(item)
  }
  catch (error) {
    shouldUpdateColor = false;
    throw error
  }
}


Module.addEvent("messageCreate", async (msg) => {

  if (!roleGuild) {
    roleGuild = await RoleClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
  }
  if (!msg.author.bot && eventRunning && msg.content?.toLowerCase().replaceAll(' ', "").indexOf('begone') > -1 && (msg.author?.id == ("431220192128008192") || msg.author.id == "487085787326840843")) {
    eventRunning = false;
    return;
  }
  else if (!msg.author.bot && !eventRunning && msg.content?.toLowerCase().replaceAll(' ', "").indexOf('bymypower,bydivinepower') > -1 && (msg.author?.id == ("431220192128008192") || msg.author.id == "487085787326840843")) {
    const holiday = await roleGuild.roles.fetch(snowflakes.roles.Holiday);
    const general = msg.guild.channels.cache.get(snowflakes.channels.general);
    const webhooks = await general.fetchWebhooks()
    let selys = webhooks.find(w => w.name.toLowerCase().indexOf("selys") > -1);
    if (!msg.content.indexOf("silent")) {
      if (!selys) {
        selys = await general.createWebhook('Selys', {
          avatar: './avatar/selysWebhook.png',
          reason: 'Holiday Event'
        })
          .then(sel => sel.send("Go forth, and steal dungeon floors.")).catch(err => { throw err });
      }
      else (await selys).send("Go forth, and steal dungeon floors.");
      await general.send("It's a very special day of the year. A time for celebrating and cherishing the love and freindships around us. Radiance is happy to announce, our Kester Day Celebrations have begun! Enjoy your holiday bonus XP.")
    } eventRunning = true;
    await holiday.setName("Kester Day");
    await holiday.setColor("#C4CBFF")
    try {
      await holiday.setIcon("./avatar/red-heart.png")
    } catch (error) {
      try {
        await holiday.setIcon("./avatar/selysWebhook.png")
      } catch (error) {
        console.error(error)
      }
      console.error(error);
    }
    updateColor();

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
}).setClockwork(() => {
  try {
    return setInterval(updateColor, 30 * 60 * 1000);
  } catch (e) { u.errorHandler(e, "update holiday role color error"); }
})

module.exports = Module;