const { Listener } = require('@sapphire/framework');
const U = require("../utilities/General")

class CommandDeniedListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      once: false,
      event: 'ChatInputCommandDenied'
    });
  }
  run(error, { interaction }) {
    if (error.context?.silent) {
      U.errorHandler(`${interaction.member.username} (${interaction.member.id}) tried to use a hidden slash command in ${interaction.channel?.guild ? interaction.channel.name + "; \n" : ""}\`\`\`${interaction.content}\`\`\` `)
      return U.clean(interaction.reply(error.message), 0);
    }
    return interaction.reply(error.message);
  }

}

module.exports = {
  CommandDeniedListener
};