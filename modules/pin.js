const Augur = require("augurbot"),
  u = require("../utils/utils"),
  { MessageActionRow, MessageButton } = require("discord.js");
  const snowflakes = require('../config/snowflakes.json');

let activeRequests = [];

const pinActions = [
  new MessageActionRow().addComponents(
    new MessageButton().setCustomId("pinApprove").setLabel("Oh Yeah, Pin it").setStyle("SUCCESS"),
    new MessageButton().setCustomId("pinReject").setLabel("Nah, lets not").setStyle("DANGER"),
  ),
];
async function pinEmbed(message, interaction) {
  let embed = u.embed({ color: 0xF0004C, author: message.member, timestamp: (message.editedAt ?? message.createdAt) })
    .setTitle("Pin request by " + `${interaction.member.displayName}`)
    .setColor(0xF0004C)
    .setTimestamp()
    .setAuthor(message.member.displayName + " 📌", message.member.user.displayAvatarURL())
    .setDescription(message.cleanContent)
    .addField("Pin Requested By", interaction.member.displayName)
    .addField("Channel", message.channel.toString())
    .addField("Jump to Post", `[Original Message](${message.url})`);
  if (message.attachments?.size > 0)
    embed.setImage(message.attachments?.first()?.url);
  return embed;
}

async function pinCard(message, interaction) {
  try {
    let embed = await pinEmbed(message, interaction)
    let content;
    let card = await message.client.channels.cache.get(snowflakes.channels.modRequests).send({ content, embeds: [embed], components: (message.author.bot ? undefined : pinActions) });
    return card;
  } catch (error) { u.errorHandler(error, "Pin Card Reaction"); }
}

/**
 * Process the pin card
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

    if (interaction.customId == "pinApprove") {
      // Approve pin
      embed.setColor(0x00FFFF);
      let messages = await target.channel.messages.fetchPinned().catch(u.noop);
      if (messages?.size == 50){
        embed.setDescription(`${requestingUser}, I was unable to pin the message since the channel pin limit has been reached.`);
        embed.setColor(0xFF0000);
        activeRequest.originalInteraction.editReply("Approved by " + mod.displayName)
      } 
      else target.pin(`Requested by ${requestingUser.displayName}`);
    } else if (interaction.customId == "pinReject") {
      // REJECT PIN
      embed.setColor(0x00FF00)
      .addField("Resolved", `${u.escapeText(mod.displayName)} cleared the flag.`);
      activeRequest.originalInteraction.editReply("❌");
    } 
    await interaction.update({ embeds: [embed], components: [] });
  } catch (error) { u.errorHandler(error, interaction); }
}

// Message context menu for bookmarking a message.

const Module = new Augur.Module()
  .addInteractionCommand({
    name: "Pin",
    commandId: "893660744879583232",
    process: async (interaction) => {
      try {
        await interaction.deferReply?.({ ephemeral: true });
        const message = await interaction.channel.messages.fetch(interaction.targetId);
        const user = interaction.member;
        if (message) {
          if (user.bot) return;
          if (message.pinnable || (!message.system && !message.deleted && (!this.guild || (message.channel?.viewable && message.channel?.permissionsFor(this.client.user)?.has(Permissions.FLAGS.MANAGE_MESSAGES, false))))) {
            // Pin Request
            try {
              if (false && (message.channel.permissionsFor(user).has("MANAGE_MESSAGES") || message.channel.permissionsFor(user).has("ADMINISTRATOR") || message.channel.permissionsFor(user).has("MANAGE_WEBHOOKS"))) {
                let messages = await message.channel.messages.fetchPinned().catch(u.noop);
                if (messages?.size == 50) return interaction.editReply({ content: `${user}, I was unable to pin the message since the channel pin limit has been reached.`, ephemeral: true });
                else message.pin(`Requested by ${user.username}`);
                interaction.editReply({ content: `I have pinned the message for you`, ephemeral: true });
              } else {
                interaction.editReply({ content: `Pin request sent.`, ephemeral: true });
                let card = await pinCard(message, interaction);
                activeRequests.push({targetMessage: message.id, targetChannel: message.channel.id, card: card.id, requstedBy: user.id, originalInteraction : interaction});
              }
            } catch (e) { u.errorHandler(e, "Pin Request Processing"); }
          } else {
            interaction.editReply({ content: `${user}, I was unable to pin that message.`, ephemeral: true });
          }
        } else {
          interaction.editReply({ content: "Against all odds, I couldn't find that message.", ephemeral: true });
        }
      } catch (error) {
        u.errorHandler(error, interaction);
      }
    }
  })
  .addInteractionHandler({ customId: "pinApprove", process: processCardAction })
  .addInteractionHandler({ customId: "pinReject", process: processCardAction });;

module.exports = Module;

