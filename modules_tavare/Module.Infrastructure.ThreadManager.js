const Augur = require("augurbot");
const Module = new Augur.Module();


Module
  .addEvent("threadCreate", async (ThreadChannel, newlyCreated) => {
    if (ThreadChannel.sendable && newlyCreated && !ThreadChannel.locked && ThreadChannel.type == "GUILD_PUBLIC_THREAD") {
      let message = await ThreadChannel.send({ content: `Adding staff to the thread, one moment please.` })

      let role_string = "";
      if (Module.config.snowflakes.roles.Moderator) role_string += `<@&${Module.config.snowflakes.roles.Moderator}>`
      if (Module.config.snowflakes.roles.Admin) role_string += `<@&${Module.config.snowflakes.roles.Admin}>`
      if (Module.config.snowflakes.roles.CommunityGuide) role_string += `<@&${Module.config.snowflakes.roles.CommunityGuide}>`
      if (role_string == "") return;


      await message.edit({ content: `Adding ${role_string} to the thread`, allowedMentions: { parse: ['roles'] } });
      await message.delete()
    }
  });
module.exports = Module;