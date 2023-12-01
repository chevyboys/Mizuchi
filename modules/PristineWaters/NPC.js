//Initalization, imports, etc
const webhookSend = require('../../utils/Webhook.js');
const event = require('./utils');


/**
 * Sends an NPC message to a channel using a webhook.
 * @param {string} channel - The channel to send the message to.
 * @param {Object} embedOptions - The options for the embedded message.
 * @param {Object} additionalMessageOptions - Additional options for the message.
 * @returns {Promise} - A promise that resolves when the message is sent.
 */
function NPCSend(channel, embedOptions, additionalMessageOptions) {
  additionalMessageOptions = additionalMessageOptions || {};
  embedOptions.color = event.colors[event.colors.length - 1].color;
  additionalMessageOptions.embeds = [embedOptions];
  return webhookSend.webhook(channel, "Archduke Soju Ryotsu", "./avatar/PristineWaters.png", additionalMessageOptions);
}

module.exports = NPCSend;