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
function NPCSend(channel, embedOptions, additionalMessageOptions, webhookOptions) {
  additionalMessageOptions = additionalMessageOptions || {};
  embedOptions.color = embedOptions.color || defaultOptions.color;
  additionalMessageOptions.embeds = [embedOptions];
  return webhookSend.webhook(channel, webhookOptions?.name || defaultOptions.name, webhookOptions?.avatar || defaultOptions.avatar, additionalMessageOptions);
}

module.exports = NPCSend;

//The example way to use this in a module would be something like this:
/************
const NPCSend = require('../utils/NPC.js');

NPCSend(channel, {
  title: "Hello, I'm an NPC!",
  description: "I can send messages using webhooks.",
  color: "#006eff"
}, {
  content: "This is an additional message option."
}, {
  name: "Custom NPC Name",
  avatar: "./avatar/customNPC.png"
});
************/