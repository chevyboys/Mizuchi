const { Listener } = require('@sapphire/framework');
const U = require("../utilities/General")

class CommandDeniedListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      once: false,
      event: 'MessageCommandDenied'
    });
  }
  run(error, { message }) {
    if (error.context?.silent) {
      U.errorHandler(`${message.author.username} (${message.author.id}) tried to use a hidden command in ${message.channel?.guild ? message.channel.name + "; \n" : ""}\`\`\`${message.content}\`\`\` `)
      return;
    }
    return message.channel.send(error.message);
  }

}

module.exports = {
  CommandDeniedListener
};