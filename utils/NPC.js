//Initalization, imports, etc
const webhookSend = require('./Webhook.js');


let defaultOptions = {
  color: "#FF0000",
  name: "Selys",
  avatar: "./avatar/selysWebhook.png"
};

/**
 * Sends an NPC message to a channel using a webhook.
 * @param {string} channel - The channel to send the message to.
 * @param {Object} embedOptions - The options for the embedded message.
 * @param {Object} additionalMessageOptions - Additional options for the message.
 * @returns {Promise} - A promise that resolves when the message is sent.
 */
function NPCSend(channel, embedOptions, additionalMessageOptions) {
  additionalMessageOptions = additionalMessageOptions || {};
  embedOptions.color = embedOptions.color || defaultOptions.color;
  additionalMessageOptions.embeds = [embedOptions];
  return webhookSend.webhook(channel, defaultOptions.name, defaultOptions.avatar, additionalMessageOptions);
}

module.exports = NPCSend;