const Augur = require("augurbot"),
    snowflakes = require('../config/snowflakes.json');

const Module = new Augur.Module()
    .addEvent("threadCreate", async (ThreadChannel, newlyCreated) => {
        if (ThreadChannel.sendable && newlyCreated && !ThreadChannel.locked && ThreadChannel.type == "GUILD_PUBLIC_THREAD") {
            await ThreadChannel.send({ content: `Adding <@&${snowflakes.roles.Admin}><@&${snowflakes.roles.Moderator}><@&${snowflakes.roles.CommunityGuide}> to the thread`, allowedMentions: { parse: ['roles'] } })
        }
    });
module.exports = Module;