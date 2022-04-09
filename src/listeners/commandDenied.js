const { Listener } = require('@sapphire/framework');

class CommandDeniedListener extends Listener {
  run(error, { message }) {
    if (error.context?.silent) return;
    return message.channel.send(error.message);
  }
}

module.exports = {
  CommandDeniedListener
};