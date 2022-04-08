const { Command, CommandOptionsRunTypeEnum } = require('@sapphire/framework');

class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'ping',
      aliases: ['pong'],
      description: "get's the bot's response time.",
      preconditions: ["BotMaintenance"],
      runIn: CommandOptionsRunTypeEnum.GuildAny,
      requiredUserPermissions: [],
      requiredClientPermissions: [],
    });
  }
  async messageRun(message) {
    const msg = await message.channel.send('Ping?');
    const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${msg.createdTimestamp - message.createdTimestamp}ms.`;
    return msg.edit(content);
  }

}


module.exports = {
  PingCommand
};