const Discord = require("discord.js");
const config = require("../config/config_tavare.json");
const defaultErrorLog = new Discord.WebhookClient(config.Webhooks.error);
const embedUtil = require('./Utils.Embed.js');
const embed = embedUtil.embed;
const { parseInteraction } = require("./Utils.ParseInteraction.js");
const get = require("./Utils.GetGoogleSheetsAsJson.js");

const webhookCache = new Map();
webhookCache.set(JSON.stringify(config.Webhooks.error), defaultErrorLog);

function wait(t) {
  return new Promise((fulfill) => {
    setTimeout(fulfill, t);
  });
}

function noop() { }

/**
 * Dynamically determines which Webhook to use based on the calling context.
 */
function getWebhook(message_or_module, botName = null) {
  let whConfig = config.Webhooks.error; // Default fallback from static require at the top

  if (message_or_module?.client?.config?.Webhooks?.error || message_or_module?.config?.Webhooks?.error) {
    whConfig = message_or_module?.client?.config?.Webhooks?.error || message_or_module?.config?.Webhooks?.error;
  }

  //lower case the botName for easier matching
  if (botName) botName = botName.toString().toLowerCase();

  // 2. STRING FALLBACK: If it's a generic text log (no client object), try to dynamically load the bot's config
  if (botName) {
    try {
      const dynamicConfig = require(`../config/config_${botName}.json`);
      if (dynamicConfig?.Webhooks?.error) {
        whConfig = dynamicConfig.Webhooks.error;
      }
    } catch (e) {
      // If the dynamic require fails (file not found), it safely ignores it and uses the default config
    }
  }

  const key = JSON.stringify(whConfig);

  // Create and cache the WebhookClient if we haven't seen this URL before
  if (!webhookCache.has(key)) {
    webhookCache.set(key, new Discord.WebhookClient(whConfig));
  }

  return webhookCache.get(key);
}

module.exports = {
  /**
   * After the given amount of time, attempts to delete the message.
   * @param {Discord.Message|Discord.Interaction} msg The message to delete.
   * @param {number} t The length of time to wait before deletion, in milliseconds.
   */
  clean: async function (msg, t = 20000) {
    await wait(t);
    if (msg instanceof Discord.CommandInteraction) {
      msg.deleteReply().catch(noop);
    } else if ((msg instanceof Discord.Message) && (msg.deletable)) {
      msg.delete().catch(noop);
    }
    return Promise.resolve(msg);
  },
  /**
   * Handles a command exception/error. Most likely called from a catch.
   * Reports the error and lets the user know.
   * @param {Error} error The error to report.
   * @param {any} message Any Discord.Message, Discord.Interaction, or text string.
   */
  errorHandler: function (error, message = null, botName = null) {
    if (!error || (error.name === "AbortError")) return;

    console.error(Date());

    const error_embed = embed().setTitle(error.name ? error.name : "Warning");
    if (!botName) {
      error_embed.setTitle("Mysterious Test Entity:" + (error.name ? error.name : "Warning"));
    } else {
      error_embed.setTitle(botName + " Error:" + (error.name ? error.name : "Warning"));
    }

    if (message instanceof Discord.Message) {
      const loc = (message.guild ? `${message.guild?.name} > ${message.channel?.name}` : "DM");
      console.error(`${message.author.username} in ${loc}: ${message.cleanContent}`);

      message.channel.send("I've run into an error. I've let my devs know.")
        .then(this.clean);
      error_embed.addField("User", message.author.username, true)
        .addField("Location", loc, true)
        .addField("Command", message.cleanContent || "`undefined`", true);
    } else if (message instanceof Discord.Interaction) {
      const loc = (message.guild ? `${message.guild?.name} > ${message.channel?.name}` : "DM");
      console.error(`Interaction by ${message.user.username} in ${loc}`);

      message[((message.deferred || message.replied) ? "editReply" : "reply")]({ content: "I've run into an error. I've let my devs know.", ephemeral: true }).catch(noop);
      error_embed.addField("User", message.user?.username, true)
        .addField("Location", loc, true);

      const descriptionLines = [message.commandId || message.customId || "`undefined`"];
      const { command, data } = parseInteraction(message) || { command: "unknown", data: [{ name: "unknown", value: "unknown" }] };
      descriptionLines.push(command);
      for (const datum of data) {
        descriptionLines.push(`${datum.name}: ${datum.value}`);
      }
      error_embed.addField("Interaction", descriptionLines.join("\n"));
    } else if (typeof message === "string") {
      console.error(message);
      error_embed.addField("Message", message);
    }

    console.trace(error);

    let stack = (error.stack ? error.stack : error.toString());
    if (stack.length > 4096) stack = stack.slice(0, 4000);

    error_embed.setDescription(stack);
    // Resolve dynamic webhook and send
    const activeWebhook = getWebhook(message, botName);
    activeWebhook.send({ embeds: [error_embed] });
  },
  get_log_webhook: getWebhook,
  /**
   * Logs a message to the console and to the error log webhook, with a timestamp and some basic formatting.
   * Can be used for general logging purposes, not just errors.
   * @param {string} message 
   * @param {string} title 
   * @param {string} botName 
   */
  log: function (message, title = "Log", botName = null) {
    if (!message) throw new Error("No message provided for logging.");

    console.log(Date());

    const log_embed = embed().setTitle(title + (botName ? `: ${botName}` : ""));

    log_embed.setColor("#5ba7ff");

    if (message instanceof Discord.Message) {
      const loc = (message.guild ? `${message.guild?.name} > ${message.channel?.name}` : "DM");
      console.log(`${message.author.username} in ${loc}: ${message.cleanContent}`);
      log_embed.addField("User", message.author.username, true)
        .addField("Location", loc, true)
        .addField("Command", message.cleanContent || "`undefined`", true);
    } else if (message instanceof Discord.Interaction) {
      const loc = (message.guild ? `${message.guild?.name} > ${message.channel?.name}` : "DM");
      console.log(`Interaction by ${message.user.username} in ${loc}`);
      log_embed.addField("User", message.user?.username, true)
        .addField("Location", loc, true);

      const descriptionLines = [message.commandId || message.customId || "`undefined`"];
      const { command, data } = parseInteraction(message) || { command: "unkown", data: [{ name: "unknown", value: "unknown" }] };
      descriptionLines.push(command);
      for (const datum of data) {
        descriptionLines.push(`${datum.name}: ${datum.value}`);
      }
      log_embed.addField("Interaction", descriptionLines.join("\n"));
    } else if (typeof message === "string") {
      console.log(message);
      log_embed.addField("Message", message);
    }
    log_embed.setDescription("Log entry");
    const activeWebhook = getWebhook(message, botName);
    activeWebhook.send({ embeds: [log_embed] });
  }
}