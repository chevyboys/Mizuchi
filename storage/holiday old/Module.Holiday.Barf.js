const snowflakes = require("../../config/snowflakes.json");
const Augur = require("augurbot");
const Module = new Augur.Module;
const RoleClient = require("../../utils/Utils.RolesLogin.js");
const NPCSend = require("../../modules/Barf/NPC.js");
let roleGuild = RoleClient.guilds.cache.get(snowflakes.guilds.PrimaryServer);
let eventRunning = false;
let shouldUpdateColor = false;
let config = require("../../config/config.json");

const u = require("../../utils/Utils.Generic.js")

const colors = ["#C00000", "#FF3334", "#FF0000", "#FF6F77", "#FFBBC1", "#e4adff", "#e0c2ff", "#FF8896", "#FC245C", "#FC8CB4", "#820123", "#960228"]
async function updateColor() {
  if (!eventRunning || !shouldUpdateColor) return;
  const holiday0 = await roleGuild.roles.fetch(snowflakes.roles.Holiday[0]);
  const holiday1 = await roleGuild.roles.fetch(snowflakes.roles.Holiday[1]);
  try {
    let item0 = colors[Math.floor(Math.random() * colors.length)];
    let item1 = colors[Math.floor(Math.random() * colors.length)];
    await holiday0.setColor(item0);
    await holiday1.setColor(item1);
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
  if (!msg.author.bot && eventRunning && msg.content?.toLowerCase().replaceAll(' ', "").indexOf('begone') > -1 && (msg.author?.id == ("431220192128008192") || config.AdminIds.indexOf(msg.author.id) > -1)) {
    eventRunning = false;
    return;
  } else if (!msg.author.bot && eventRunning && msg.content?.toLowerCase().replaceAll(' ', "").indexOf('invokemypower') > -1) {
    updateColor();
    msg.react("♥️");
  }
  else if (!msg.author.bot && !eventRunning && msg.content?.toLowerCase().replaceAll(' ', "").indexOf('bymypower,bydivinepower') > -1 && (msg.author?.id == ("431220192128008192") || config.AdminIds.indexOf(msg.author.id) > -1)) {
    const holiday0 = await roleGuild.roles.fetch(snowflakes.roles.Holiday[0]);
    const holiday1 = await roleGuild.roles.fetch(snowflakes.roles.Holiday[1]);
    const general = msg.guild.channels.cache.get(snowflakes.channels.general) || await msg.guild.channels.fetch(snowflakes.channels.general);
    await NPCSend(general, { description: "Go forth, and steal dungeon floors.", color: "#FF0000", title: "Be A Real Friend Week Special Event" });
    await general.send("It's a very special day of the year. A time for celebrating and cherishing the love and freindships around us. Radiance is happy to announce, our Be A Real Friend Week Celebrations have begun! Enjoy your holiday bonus XP.");
    eventRunning = true;
    shouldUpdateColor = true;
    msg.react("👌");
    await holiday0.setName("Kester Day");
    await holiday0.setColor(colors[Math.floor(Math.random() * colors.length)]);
    await holiday1.setName("Kester Day");
    await holiday1.setColor(colors[Math.floor(Math.random() * colors.length)]);
    try {
      await holiday0.setIcon("./avatar/red-heart.png");
      await holiday1.setIcon("./avatar/red-heart.png");
    } catch (error) {
      try {
        await holiday0.setIcon("./avatar/selysWebhook.png");
        await holiday1.setIcon("./avatar/selysWebhook.png");
      } catch (error) {
        console.error(error)
      }
      console.error(error);
    }
    updateColor();

  }
  else if (!eventRunning || msg.author.bot || !msg.member || msg.member.roles?.cache.has(snowflakes.roles.Holiday[0]) || msg.member.roles?.cache.has(snowflakes.roles.Holiday[1])) return;
  else {
    let member = await roleGuild.members.fetch(msg.member.id);

    try {
      //add a random Holiday role to the user
      let role = roleGuild.roles.cache.get(snowflakes.roles.Holiday[Math.floor(Math.random() * snowflakes.roles.Holiday.length)]);
      member.roles.add(role);
      console.log("Added holiday role to " + msg.member.displayName)
    } catch (error) {
      const modRequests = msg.guild.channels.cache.get(snowflakes.channels.modRequests);
      modRequests.send("I couldn't add the <@&" + role + " role to " + msg.member.displayName)
      throw error;
    }


  }
}).setClockwork(() => {
  try {
    return setInterval(updateColor, 30 * 60 * 1000);
  } catch (e) { u.errorHandler(e, "update holiday role color error"); }
})

module.exports = Module;