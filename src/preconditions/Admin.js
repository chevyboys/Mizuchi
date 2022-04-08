const { Precondition } = require('@sapphire/framework'),
    Config = require("../../config/config.json"),
    Snowflakes = require("../../config/snowflakes.json")

class AdminPrecondition extends Precondition {

    run(message) {
        return (Config.AdminIds.includes(message.author.id) || message.member?.roles.cache.has(Snowflakes.roles.Admin) || message.member?.permissions.has("ADMINISTRATOR"))
            ? this.ok()
            : this.error({
                message: 'Only the bot owner, or server administrators can use this command!',
                context: { silent: false }
            });
    }
}

module.exports = {
    AdminPrecondition
};