const Augur = require("augurbot"),
u = require("../utils/utils");

// Message context menu for bookmarking a message.

async function spoilerMsg(msg) {
    u.clean(msg, 0);
    let newMessage = {
        content: `||${msg.content}||`
    }
    if(msg.embeds){
        newMessage.embeds = msg.embeds
        for (const embed of newMessage.embeds) {
           embed.description = `||${embed.description}||`;
           embed.title = `||${embed.title}||`;
           for (const feild in embed.feilds) {
               feild = `||${feild}||`
           }
        }
    }
    if(msg.attachements && msg.attachements.length > -1){
        newMessage.attachements = msg.attachements;
        for (const attachement of newMessage.attachements ) {
            if(attachement) {
                attachement.name = "SPOILER_" + attachement.name;
            }
        }
    }
    newMessage.components = msg.components;
    msg.channel.send(newMessage);
}

const Module = new Augur.Module()
.addInteractionCommand({ name: "Spoilers",
process: async (interaction) => {
  try {
    await interaction.deferReply?.({ ephemeral: true });
    const message = await interaction.channel.messages.fetch(interaction.targetId);
    if (message) {
      await interaction.editReply({ content: "I have spoilered that message", ephemeral: true });
      await spoilerMsg(message);
    } else {
      interaction.editReply({ content: "Against all odds, I couldn't find that message.", ephemeral: true });
    }
  } catch (error) {
    u.errorHandler(error, interaction);
  }
}
});

module.exports = Module;