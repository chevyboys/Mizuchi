const Augur = require("augurbot"),
  modRequest = require('../utils/Utils.ContextMenu.Message.ModCard'),
  config = require("../config/config.json"),
  snowflakes = require("../config/snowflakes.json");
const { MessageButton, MessageActionRow, WebhookClient } = require('discord.js');
const webhookUtil = require("../utils/Webhook").webhook;
const Module = new Augur.Module()
//const kesterBombHook = new WebhookClient(config.Webhooks.kesterBombs);


async function buildMessage(messageToBeBombed, color) {
  const url = messageToBeBombed.url;
  const guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
  //recurse through all responses in a chain
  let returnObj = [];
  if (messageToBeBombed.reference) {
    let referencedMessageChannel = await guild.channels.fetch(messageToBeBombed.reference.channelId);
    let referencedMessage = await referencedMessageChannel.messages.fetch(messageToBeBombed.reference.messageId);
    returnObj = await buildMessage(referencedMessage, color);
  }
  let files = messageToBeBombed.attachments ? Array.from(messageToBeBombed.attachments.values()).map(v => v.attachment) : null
  const components = [new MessageActionRow()
    .addComponents(
      new MessageButton({
        disabled: false,
        label: "Original Message",
        style: "LINK",
        url: url
      }))
  ]
  //if (messageToBeBombed.content) messageToBeBombed.embeds?.unshift(embed);
  returnObj.push({
    content: (messageToBeBombed.content ? ">>> " + messageToBeBombed.content : "") + "\n\n" + url,
    username: (await messageToBeBombed.member)?.displayName || messageToBeBombed.author.username,
    avatarURL: (await messageToBeBombed.member)?.avatarURL() || (await messageToBeBombed.author)?.avatarURL(),
    embeds: messageToBeBombed.embeds,
    allowedMentions: { parse: [] },
    files: files,
    components: components
  })
  return returnObj;
}

async function kesterBomb(inputObject) {
  let color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  const guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
  let channelToBeBombed = guild.channels.cache.get(inputObject.target.channelId);
  let messageToBeBombed = await channelToBeBombed.messages.fetch(inputObject.target.id);
  let messagesToSend = await buildMessage(messageToBeBombed, color);
  for (let index = 0; index < messagesToSend.length; index++) {
    const messageToSend = messagesToSend[index];
    //await kesterBombHook.send(messageToSend);
    await webhookUtil(guild.channels.cache.get(snowflakes.channels.kesterBomb), "kesterBombhook", "./avatar/base.png", messageToSend)
  }


}


modRequest(Module, "Kester Bomb", snowflakes.emoji.messageContextMenu.kesterBomb, kesterBomb, kesterBomb);


module.exports = Module;