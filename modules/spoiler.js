const Augur = require("augurbot"),
u = require("../utils/utils");
const snowflakes = require('../config/snowflakes.json');

// Message context menu for mods spoilering things

async function spoilerMsg(msg) {
    u.clean(msg, 0);
    let introduction = "";
    if (msg.author != Module.client.user) introduction = msg.member.displayName + " says: ";
    let newMessage;
    if(msg.content.length > 0) {
        newMessage = {
            content: `${introduction}||${msg.content}||`
        }
    }
    else {
        newMessage = {
        }
    }
    if(msg.embeds){
        newMessage.embeds = msg.embeds
        for (const embed of newMessage.embeds) {
           embed.description = `||${embed.description}||`;
           embed.title = `||${embed.title}||`;
           for (const field in embed.fields) {
                field.value = `||${field.value}||`
           }
        }
    }
    if(msg.attachements && msg.attachements.length > 0){
        newMessage.attachements = msg.attachements;
        for (const attachement of newMessage.attachements ) {
            if(attachement) {
                attachement.name = "SPOILER_" + attachement.name;
            }
        }
    }
    newMessage.files = msg.files;
    newMessage.components = msg.components;
    msg.channel.send(newMessage);
}

const Module = new Augur.Module()
.addInteractionCommand({ name: "spoilers",
guildId: snowflakes.guilds.PrimaryServer,
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