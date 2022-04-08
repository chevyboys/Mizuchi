const { Precondition } = require('@sapphire/framework'),
    Config = require("../../config/config.json"),
    Snowflakes = require("../../config/snowflakes.json")

class AdminModBotMasterPrecondition extends Precondition {

    run(message) {
        return (Config.AdminIds.includes(message.author.id) ||
            message.member?.roles.cache.has(Snowflakes.roles.Admin) ||
            message.member?.permissions.has("ADMINISTRATOR") ||
            message.member?.roles.cache.has(Snowflakes.roles.Moderator) ||
            message.member?.roles.cache.has(Snowflakes.roles.BotMaster)
        )
            ? this.ok()
            : this.error({ message: 'Only the bot owner, server administrators,  moderators, and bot masters can use this command!',
            context: { silent: true }
         });
    }
}

module.exports = {
    AdminModBotMasterPrecondition
};