const { Precondition } = require('@sapphire/framework'),
    Config = require("../../config/config.json"),
    Snowflakes = require("../../config/snowflakes.json")

class BotMaintanencePrecondition extends Precondition {

    run(message) {
        return (Config.AdminIds.includes(message.author.id) 
        || message.member?.roles.cache.has(Snowflakes.roles.Admin) 
        || message.member?.permissions.has("ADMINISTRATOR") 
        || message.member?.roles.cache.has(Snowflakes.roles.BotMaster))
            ? this.ok()
            : this.error({ message: 'Only the bot masters and moderation staff can use this command!' });
    }
}

module.exports = {
    BotMaintanencePrecondition
};