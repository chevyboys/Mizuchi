//Initalization, imports, etc
const webhookSend = require('../../utils/Webhook.js');


/**
 * Sends an NPC message to a channel using a webhook.
 * @param {string} channel - The channel to send the message to.
 * @param {Object} embedOptions - The options for the embedded message.
 * @param {Object} additionalMessageOptions - Additional options for the message.
 * @returns {Promise} - A promise that resolves when the message is sent.
 */
function NPCSend(channel, embedOptions, additionalMessageOptions) {
  additionalMessageOptions = additionalMessageOptions || {};
  embedOptions.color = "#010101";
  additionalMessageOptions.embeds = [embedOptions];
  return webhookSend.webhook(channel, "Mysterious Voice", "./avatar/Halloween.png", additionalMessageOptions);
}

module.exports = NPCSend;