const { Command, CommandOptionsRunTypeEnum } = require('@sapphire/framework');
const u = require('../../utilities/General');

class GoToBedCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'gotobed',
            aliases: ['gotosleep', 'reboot', 'restart'],
            description: "Pulls the latest code from the github",
            preconditions: ["BotAdmin"],
            runIn: CommandOptionsRunTypeEnum.GuildAny,
            requiredUserPermissions: [],
            requiredClientPermissions: ["ADD_REACTIONS"],
        });
    }
    /**
     * 
     * @param {Message} msg 
     */
    async messageRun(msg) {
        try {
            await msg.react("🛏");
            await msg.client.destroy();
            process.exit();
        } catch (e) { u.errorHandler(e, msg); }

    }
}

module.exports = {
    GoToBedCommand
};