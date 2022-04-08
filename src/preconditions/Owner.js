const { Precondition } = require('@sapphire/framework');
const Config = require("../../config/config.json")

class OwnerPrecondition extends Precondition {

    run(message) {
        return Config.AdminIds.includes(message.author.id)
            ? this.ok()
            : this.error({
                message: 'Only the bot owner can use this command!',
                context: { silent: true }
            });
    }
}
    
module.exports = {
    OwnerPrecondition
};