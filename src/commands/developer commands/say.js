const { Command, CommandOptionsRunTypeEnum } = require('@sapphire/framework');
const u = require('../../utilities/General');
const Config = require('../../../config/config.json');

class SayCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'say',
            aliases: [],
            description: "Say things as the bot",
            preconditions: ["ServerAdmin+"],
            runIn: CommandOptionsRunTypeEnum.GuildAny,
            requiredUserPermissions: [],
            requiredClientPermissions: ["SEND_MESSAGES", "MANAGE_MESSAGES"],
        });
    }
    /**
     * 
     * @param {Message} msg 
     */
    async messageRun(msg) {
        let suffix = msg.content.slice(msg.content.indexOf(" ")+1);
        msg.channel.send(suffix);
        u.clean(msg, 0);
    }
}

module.exports = {
    SayCommand
};