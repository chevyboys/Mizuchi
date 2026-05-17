const Augur = require("augurbot");
const Module = new Augur.Module();


Module
  .addEvent("threadCreate", async (ThreadChannel, newlyCreated) => {
    if (ThreadChannel.sendable && newlyCreated && !ThreadChannel.locked && ThreadChannel.type == "GUILD_PUBLIC_THREAD") {
      let message = await ThreadChannel.send({ content: `Adding staff to the thread, one moment please.` })
      await message.edit({ content: `Adding <@&${Module.config.snowflakes.roles.Admin}><@&${Module.config.snowflakes.roles.Moderator}><@&${Module.config.snowflakes.roles.CommunityGuide}> to the thread`, allowedMentions: { parse: ['roles'] } });
      await message.delete()
    }
  });
module.exports = Module;