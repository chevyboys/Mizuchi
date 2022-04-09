const { Precondition } = require('@sapphire/framework'),
    Config = require("../../config/config.json"),
    Snowflakes = require("../../config/snowflakes.json")

class ServerModsPrecondition extends Precondition {

    run(message) {
        return (Config.AdminIds.includes(message.author.id) || message.member?.roles.cache.has(Snowflakes.roles.Admin) || message.member?.permissions.has("ADMINISTRATOR") || message.member?.roles.cache.has(Snowflakes.roles.Moderator) )
            ? this.ok()
            : this.error({ message: 'Only the bot owner, server administrators, or moderators can use this command!' });
    }
}

module.exports = {
    ServerModsPrecondition
};