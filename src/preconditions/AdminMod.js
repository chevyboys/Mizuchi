const { Precondition } = require('@sapphire/framework'),
    Config = require("../../config/config.json"),
    Snowflakes = require("../../config/snowflakes.json")

class AdminModPrecondition extends Precondition {

    run(message) {
        return (Config.AdminIds.includes(message.author.id) || message.member?.roles.cache.has(Snowflakes.roles.Admin) || message.member?.permissions.has("ADMINISTRATOR") || message.member?.roles.cache.has(Snowflakes.roles.Moderator) )
            ? this.ok()
            : this.error({ message: 'Only the bot owner, server administrators, and moderators can use this command!',
            context: { silent: false }
         });
    }
}

module.exports = {
    AdminModPrecondition
};