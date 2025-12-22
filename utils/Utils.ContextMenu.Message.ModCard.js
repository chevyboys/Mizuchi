const u = require("./Utils.Generic"),
  { MessageActionRow, MessageButton } = require("discord.js");
const Discord = require("discord.js");
const snowflakes = require('../config/snowflakes.json');

let activeRequests = [];


// Message context menu for bookmarking a message.
/**
 * @param {Augur.Module} Module
 * @param {string} modRequestFunctionNameParam the name of the mod request function. Should be a single word.
 * @param {string} modRequestFunctionEmojiParam the emoji associated with this function
 * @param {function approvedCallback({mod,card,embed,activeRequest, requestingUser, target, interaction})} approvedCallback //What happens on approval
 * @param {function overrideCallback({mod, target, interaction})} overrideCallback this function should accept an object containing the mod doing the action, the interaction, and the target message. It is executed if the person has moderation privilages
 */
let modRequest = (Module, modRequestFunctionNameParam, modRequestFunctionEmojiParam, approvedCallback, overrideCallback) => {
  Module.reactionHandlers = Module.reactionHandlers || [];
  let modRequestFunctionName = modRequestFunctionNameParam;
  let modRequestFunctionEmoji = modRequestFunctionEmojiParam;
  Module.reactionHandlers.push({ emoji: modRequestFunctionEmojiParam, approvedCallback: approvedCallback, overrideCallback: overrideCallback })
  /*async function handleReaction(reaction, user, reactionHandler){
      message = reaction.message;
      if (message.guild?.id != snowflakes.guilds.PrimaryServer || user.bot) return;
      if ((reaction.emoji.name == modRequestFunctionEmoji)) {
        // Pin Request
        try {
          if ((message.channel.permissionsFor(user).has("MANAGE_MESSAGES") || message.channel.permissionsFor(user).has("ADMINISTRATOR") || message.channel.permissionsFor(user).has("MANAGE_WEBHOOKS"))) {
            reactionHandler.overrideCallback({
              mod: user,
              user: user,
              target: message,
              interaction: message
            })
          } else {
            let card = await modRequestCard(message, message, user);
            activeRequests.push({ 
              targetMessage: message.id, 
              targetChannel: message.channel.id, 
              card: card.id, 
              requstedBy: user.id, 
              originalInteraction: message, 
              reactionEmoji: modRequestFunctionEmojiParam });
          }
        } catch (e) { u.errorHandler(e, "modRequest Request Processing"); }
      }
  }*/

  const modRequestActions = [
    new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`${modRequestFunctionName}Approve`).setLabel(`Oh Yeah, ${modRequestFunctionName} it`).setStyle("SUCCESS"),
      new MessageButton().setCustomId(`${modRequestFunctionName}Reject`).setLabel("Nah, lets not").setStyle("DANGER"),
    ),
  ];
  async function modRequestEmbed(message, interaction, user) {
    return await u.modRequestEmbed(modRequestFunctionName, message, interaction, user, modRequestFunctionEmoji)
  }

  async function modRequestCard(message, interaction, user) {
    try {
      let embed = await modRequestEmbed(message, interaction, user)
      let content = `<@&${snowflakes.roles.Moderator}>`;
      let card = await message.client.channels.cache.get(snowflakes.channels.modRequests).send({ content: content, embeds: [embed], components: (modRequestActions), allowedMentions: { roles: [snowflakes.roles.Moderator] } });
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
        let interactionHandlerInputObject = {
          mod: mod,
          user: mod,
          card: card,
          embed: embed,
          activeRequest: activeRequest,
          requestingUser: requestingUser,
          target: target,
          interaction: interaction,
          Module: Module
        }
        if (activeRequest.reactionEmoji) {
          Module.reactionHandlers.find(r => {
            return r.emoji == activeRequest.reactionEmoji
          }).approvedCallback(interactionHandlerInputObject);
        }
        else approvedCallback(interactionHandlerInputObject);
      } else if (interaction.customId == `${modRequestFunctionName}Reject`) {
        // REJECT modRequest
        embed.setColor(0x00FF00)
          .addField("Resolved", `${u.escapeText(mod.displayName)} cleared the flag.`);
        if (activeRequest.originalInteraction instanceof Discord.Integration)
          activeRequest.originalInteraction.editReply("❌");
        else if (activeRequest.originalInteraction instanceof Discord.Message) {
          activeRequest.originalInteraction.react("❌");
          const userReactions = activeRequest.originalInteraction.reactions.cache.filter(reaction => reaction.users.cache.has(activeRequest.requstedBy));
          try {
            for (const reaction of userReactions.values()) {
              await reaction.users.remove(activeRequest.requstedBy);
            }
          } catch (error) {
            console.error('Failed to remove reactions.');
          }
        }
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
            if ((!message.system && !message.deleted)) {
              // modRequest Request
              try {
                if ((message.channel.permissionsFor(user).has("MANAGE_MESSAGES") || message.channel.permissionsFor(user).has("ADMINISTRATOR") || message.channel.permissionsFor(user).has("MANAGE_WEBHOOKS"))) {
                  overrideCallback({
                    mod: user,
                    user: user,
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
    .addInteractionHandler({ customId: `${modRequestFunctionName}Reject`, process: processCardAction })
  /*.addEvent("messageReactionAdd", async (reaction, user) => {
    if(Module.reactionHandlers.filter(r => {
      return r.emoji == reaction.emoji.name
    }).length > 0) {
      let reactionHandler = Module.reactionHandlers.find(r => {
        return r.emoji == reaction.emoji.name
      })
      handleReaction(reaction, user, reactionHandler)
    }
  });*/
}

module.exports = modRequest;
