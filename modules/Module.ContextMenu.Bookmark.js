const Augur = require("augurbot"),
    u = require("../utils/utils");
const snowflakes = require('../config/snowflakes.json');

// Message context menu for bookmarking a message.

async function sendBookmark(message, userToSendBookmarkTo) {
    const embed = u.embed()
        .setAuthor(message.member?.displayName || message.author?.username, message.author?.displayAvatarURL({ size: 16 }), message.url)
        .setDescription(message.cleanContent)
        .setColor(message.member?.displayColor)
        .setTimestamp(message.createdAt);
    await userToSendBookmarkTo.send({ embeds: [embed].concat(message.embeds), files: Array.from(message.attachments.values()) });
}


const Module = new Augur.Module()
    .addInteractionCommand({
        name: "Bookmark",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {
            try {
                await interaction.deferReply?.({ ephemeral: true });
                const message = await interaction.channel.messages.fetch(interaction.targetId);
                if (message) {
                    await interaction.editReply({ content: "I'm sending you a DM!", ephemeral: true });
                    await sendBookmark(message, interaction.user)
                } else {
                    interaction.editReply({ content: "Against all odds, I couldn't find that message.", ephemeral: true });
                }
            } catch (error) {
                u.errorHandler(error, interaction);
            }
        }
    }).addEvent("messageReactionAdd", async (reaction, user) => {
        if (reaction != snowflakes.emoji.messageContextMenu.bookmark) {
            return;
        } else {
            try {
                await sendBookmark(reaction.message, user)
            } catch (error) {
                u.errorHandler(error);
            }
        }
    });

module.exports = Module;