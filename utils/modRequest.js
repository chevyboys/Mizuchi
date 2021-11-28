const Augur = require("augurbot"),
  u = require("../utils/utils"),
  { MessageActionRow, MessageButton } = require("discord.js");
const snowflakes = require('../config/snowflakes.json');

let activeRequests = [];



// Message context menu for bookmarking a message.
/**
 * @param {Augur.Module} Module
 * @param {string} modRequestFunctionNameParam the name of the mod request function. Should be a single word.
 * @param {string} modRequestFunctionEmojiParam the emoji associated with this function
 * @param {function approvedCallback({mod,card,embed,activeRequest, requestingUser, target, interaction})} approvedCallback
 * @param {function overrideCallback({mod, target, interaction})} overrideCallback this function should accept an object containing the mod doing the action, the interaction, and the target message
 */
modRequest = async (Module, modRequestFunctionNameParam, modRequestFunctionEmojiParam, approvedCallback, overrideCallback) => {
  let modRequestFunctionName = modRequestFunctionNameParam;
  let modRequestFunctionEmoji = modRequestFunctionEmojiParam;

  const modRequestActions = [
    new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`${modRequestFunctionName}Approve`).setLabel(`Oh Yeah, ${modRequestFunctionName} it`).setStyle("SUCCESS"),
      new MessageButton().setCustomId(`${modRequestFunctionName}Reject`).setLabel("Nah, lets not").setStyle("DANGER"),
    ),
  ];
  async function modRequestEmbed(message, interaction) {
    let embed = u.embed({ color: 0xF0004C, author: message.member, timestamp: (message.editedAt ?? message.createdAt) })
      .setTitle(`${modRequestFunctionName} request by ` + `${interaction.member.displayName}`)
      .setColor(0xF0004C)
      .setTimestamp()
      .setAuthor(message.member.displayName + " " + modRequestFunctionEmoji, message.member.user.displayAvatarURL())
      .setDescription(message.cleanContent)
      .addField(`${modRequestFunctionName} requested by `, interaction.member.displayName)
      .addField("Channel", message.channel.toString())
      .addField("Jump to Post", `[Original Message](${message.url})`);
    if (message.attachments?.size > 0)
      embed.setImage(message.attachments?.first()?.url);
    return embed;
  }

  async function modRequestCard(message, interaction) {
    try {
      let embed = await modRequestEmbed(message, interaction)
      let content;
      let card = await message.client.channels.cache.get(snowflakes.channels.modRequests).send({ content, embeds: [embed], components: (message.author.bot ? undefined : modRequestActions) });
      return card;
    } catch (error) { u.errorHandler(error, `${modRequestFunctionName} Card Reaction`); }
  }

  /**
   * Process the modRequest card
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

      if (interaction.customId == `${modRequestFunctionName}Approve`) {
        // Approve modRequest
        embed.setColor(0x00FFFF);
        approvedCallback({
          mod: mod,
          card: card,
          embed: embed,
          activeRequest: activeRequest,
          requestingUser: requestingUser,
          target: target,
          interaction: interaction
        });
      } else if (interaction.customId == `${modRequestFunctionName}Reject`) {
        // REJECT modRequest
        embed.setColor(0x00FF00)
          .addField("Resolved", `${u.escapeText(mod.displayName)} cleared the flag.`);
        activeRequest.originalInteraction.editReply("❌");
      }
      await interaction.update({ embeds: [embed], components: [] });
    } catch (error) { u.errorHandler(error, interaction); }
  }
  Module
    .addInteractionCommand({
      name: `${modRequestFunctionName}`,
      guildId: snowflakes.guilds.PrimaryServer,
      process: async (interaction) => {
        try {
          await interaction.deferReply?.({ ephemeral: true });
          const message = await interaction.channel.messages.fetch(interaction.targetId);
          const user = interaction.member;
          if (message) {
            if (user.bot) return;
            if (message.pinnable || (!message.system && !message.deleted && (!this.guild || (message.channel?.viewable && message.channel?.permissionsFor(this.client.user)?.has(Permissions.FLAGS.MANAGE_MESSAGES, false))))) {
              // modRequest Request
              try {
                if ((message.channel.permissionsFor(user).has("MANAGE_MESSAGES") || message.channel.permissionsFor(user).has("ADMINISTRATOR") || message.channel.permissionsFor(user).has("MANAGE_WEBHOOKS"))) {
                  overrideCallback({
                    mod: user,
                    target: message,
                    interaction: interaction
                  })
                  interaction.editReply({ content: `I have completed the mod action on the message for you`, ephemeral: true });
                } else {
                  interaction.editReply({ content: `${modRequestFunctionName} request sent.`, ephemeral: true });
                  let card = await modRequestCard(message, interaction);
                  activeRequests.push({ targetMessage: message.id, targetChannel: message.channel.id, card: card.id, requstedBy: user.id, originalInteraction: interaction });
                }
              } catch (e) { u.errorHandler(e, "modRequest Request Processing"); }
            } else {
              interaction.editReply({ content: `${user}, I was unable to execute the ${modRequestFunctionName} attempt on that message.`, ephemeral: true });
            }
          } else {
            interaction.editReply({ content: "Against all odds, I couldn't find that message.", ephemeral: true });
          }
        } catch (error) {
          u.errorHandler(error, interaction);
        }
      }
    })
    .addInteractionHandler({ customId: `${modRequestFunctionName}Approve`, process: processCardAction })
    .addInteractionHandler({ customId: `${modRequestFunctionName}Reject`, process: processCardAction });;
}

module.exports = modRequest;
