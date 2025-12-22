const Augur = require("augurbot"),
  snowflakes = require('../config/snowflakes.json');

const Module = new Augur.Module()
  .addEvent("threadCreate", async (ThreadChannel, newlyCreated) => {
    if (ThreadChannel.sendable && newlyCreated && !ThreadChannel.locked && ThreadChannel.type == "GUILD_PUBLIC_THREAD") {
      let message = await ThreadChannel.send({ content: `Adding staff to the thread, one moment please.` })
      await message.edit({ content: `Adding <@&${snowflakes.roles.Admin}><@&${snowflakes.roles.Moderator}><@&${snowflakes.roles.CommunityGuide}> to the thread`, allowedMentions: { parse: ['roles'] } });
      await message.delete()
    }
  });
module.exports = Module;