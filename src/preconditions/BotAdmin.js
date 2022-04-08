const { Precondition } = require('@sapphire/framework');
const Config = require("../../config/config.json")

class BotAdminPrecondition extends Precondition {

    run(message) {
        return Config.AdminIds.includes(message.author.id)
            ? this.ok()
            : this.error({ message: 'Only the bot administrators can use this command!' });
    }
}

module.exports = {
    BotAdminPrecondition
};