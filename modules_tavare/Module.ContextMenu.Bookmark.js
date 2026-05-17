const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const Module = new Augur.Module();
const db = require("../utils/Utils.Database");


/**
 * Returns true if the member has a role that indicates they have access to redacted info
 * @param {GuildMember} member 
 * @returns {boolean}
 */
async function memberHasSensativeData(member) {
  if (!member) return false;
  return await db.User.hasSensitiveRoles(member.id, member.guild.id);
}


// Message context menu for bookmarking a message.

/**
 * Sends a copy of any guild message to a user, so long as the permissions checks work
 * @param {Message} message 
 * @param {User} userToSendBookmarkTo 
 * @returns 
 */
async function sendBookmark(message, userToSendBookmarkTo) {
  if (await memberHasSensativeData(message.member)) {
    return false;
  } else {
    const embed = u.embed()
      .setAuthor(message.member?.displayName || message.author?.username, message.author?.displayAvatarURL({ size: 16 }), message.url)
      .setDescription(message.cleanContent)
      .setColor(message.member?.displayColor)
      .setTimestamp(message.createdAt);
    await userToSendBookmarkTo.send({ embeds: [embed].concat(message.embeds), files: Array.from(message.attachments.values()) });
    return true;
  }
}

const response = "Looks like that user might have access to non-public information, and to protect the world maker's intellectual property and prevent accidental leaks from spreading, I can't bookmark that"
Module
  .addInteractionCommand({
    name: "Bookmark",

    process: async (interaction) => {
      try {
        await interaction.deferReply?.({ ephemeral: true });
        const message = await interaction.channel.messages.fetch(interaction.targetId);
        if (message) {
          await interaction.editReply({ content: "I'm sending you a DM!", ephemeral: true });
          let canSendMessage = await sendBookmark(message, interaction.user);
          if (!canSendMessage) {
            await interaction.editReply({ content: response, ephemeral: true });
          }
        } else {
          interaction.editReply({ content: "Against all odds, I couldn't find that message.", ephemeral: true });
        }
      } catch (error) {
        u.errorHandler(error, interaction);
      }
    }
  }).addEvent("messageReactionAdd", async (reaction, user) => {
    if (reaction.emoji.name != Module.config.snowflakes.emoji.messageContextMenu.bookmark) {
      return;
    } else {
      try {
        let canSendMessage = await sendBookmark(reaction.message, user)
        if (!canSendMessage) {
          await user.send({ content: response, ephemeral: true });
        }
      } catch (error) {
        u.errorHandler(error);
      }
    }
  });

module.exports = Module;
