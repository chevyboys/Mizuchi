const Augur = require("augurbot"),
u = require("../utils/utils"),
  { MessageActionRow, MessageButton } = require("discord.js");
const snowflakes = require('../config/snowflakes.json');

// Message context menu for mods spoilering things

async function spoilerMsg(msg) {
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
         for (const field of embed.fields) {
              field.value = `||${field.value}||`;
         }
      }
  }
  if(msg.attachements && msg.attachements.length > 0){
      newMessage.attachements = msg.attachements;
      for (const attachement of newMessage.attachements ) {
              attachement.setName("SPOILER_" + attachement.name);
      }
  }
  newMessage.files = msg.files;
  newMessage.components = msg.components;
  msg.channel.send(newMessage);
  u.clean(msg, 0);
}

//things stolen from pin.js
let activeRequests = [];

const spoilerActions = [
  new MessageActionRow().addComponents(
    new MessageButton().setCustomId("spoilerApprove").setLabel("Oh Yeah, Pin it").setStyle("SUCCESS"),
    new MessageButton().setCustomId("spoilerReject").setLabel("Nah, lets not").setStyle("DANGER"),
  ),
];
async function spoilerEmbed(message, interaction) {
  let embed = u.embed({ color: 0xF0004C, author: message.member, timestamp: (message.editedAt ?? message.createdAt) })
    .setTitle("Spoil request by " + `${interaction.member.displayName}`)
    .setColor(0xF0004C)
    .setTimestamp()
    .setAuthor(message.member.displayName + " 📌", message.member.user.displayAvatarURL())
    .setDescription(message.cleanContent)
    .addField("Spoil Requested By", interaction.member.displayName)
    .addField("Channel", message.channel.toString())
    .addField("Jump to Post", `[Original Message](${message.url})`);
  if (message.attachments?.size > 0)
    embed.setImage(message.attachments?.first()?.url);
  return embed;
}

async function spoilerCard(message, interaction) {
  try {
    let embed = await spoilerEmbed(message, interaction)
    let content;
    let card = await message.client.channels.cache.get(snowflakes.channels.modRequests).send({ content, embeds: [embed], components: (spoilerActions) });
    return card;
  } catch (error) { u.errorHandler(error, "Spoiler Card Reaction"); }
}

/**
 * Process the spoiler card
 * @async
 * @function processCardAction
 * @param {Discord.ButtonInteraction} interaction The interaction of a mod selecting the button.
 */
async function processCardAction(interaction) {
  try {
    const mod = interaction.member,
    card = interaction.message,
    embed = u.embed(card.embeds[0]);
    let activeRequest = activeRequests.filter(ar => ar.card == card.id)[0];
    let requestingUser = await interaction.guild.members.cache.get(activeRequest.requstedBy);
    const target = await (await interaction.guild.channels.cache.get(activeRequest.targetChannel)).messages.cache.get(activeRequest.targetMessage);

    if (interaction.customId == "spoilerApprove") {
      // Approve spoiler
      embed.setColor(0x00FFFF);
      await spoilerMsg(target);
    } else if (interaction.customId == "spoilerReject") {
      // REJECT SPOILER
      embed.setColor(0x00FF00)
      .addField("Resolved", `${u.escapeText(mod.displayName)} cleared the flag.`);
      activeRequest.originalInteraction.editReply("❌");
    } 
    await interaction.update({ embeds: [embed], components: [] });
  } catch (error) { u.errorHandler(error, interaction); }
}



const Module = new Augur.Module()
.addInteractionCommand({ name: "Spoilers",
guildId: snowflakes.guilds.PrimaryServer,
process: async (interaction) => {
  try {
    await interaction.deferReply?.({ ephemeral: true });
    const message = await interaction.channel.messages.fetch(interaction.targetId);
    const user = interaction.member;
    if (message) {
      if (user.bot) return;
      if ((!message.system && !message.deleted && (!this.guild || (message.channel?.viewable && message.channel?.permissionsFor(this.client.user)?.has(Permissions.FLAGS.MANAGE_MESSAGES, false))))) {
        // Spoiler Request
        try {
          if (user.roles.cache.has(snowflakes.roles.Admin) || user.roles.cache.has(snowflakes.roles.Whisper)) {
            spoilerMsg(message)
            interaction.editReply({ content: `I have spoilered the message for you`, ephemeral: true });
          } else {
            interaction.editReply({ content: `Spoiler request sent.`, ephemeral: true });
            let card = await spoilerCard(message, interaction);
            activeRequests.push({targetMessage: message.id, targetChannel: message.channel.id, card: card.id, requstedBy: user.id, originalInteraction : interaction});
          }
        } catch (e) { u.errorHandler(e, "Spoiler Request Processing"); }
      } else {
        interaction.editReply({ content: `${user}, I was unable to spoil that message.`, ephemeral: true });
      }
    } else {
      interaction.editReply({ content: "Against all odds, I couldn't find that message.", ephemeral: true });
    }
  } catch (error) {
    u.errorHandler(error, interaction);
  }
}
})
.addInteractionHandler({ customId: "spoilerApprove", process: processCardAction })
.addInteractionHandler({ customId: "spoilerReject", process: processCardAction });;

module.exports = Module;