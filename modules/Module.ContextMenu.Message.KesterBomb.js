const Augur = require("augurbot"),
  modRequest = require('../utils/Utils.ContextMenu.Message.ModCard'),
  u = require("../utils/Utils.Generic");
snowflakes = require("../config/snowflakes.json");
const { MessageButton, MessageActionRow, WebhookClient } = require('discord.js');
const webhookUtil = require("../utils/Webhook").webhook;
const Module = new Augur.Module()



async function buildMessage(messageToBeBombed) {
  const guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
  //recurse through all responses in a chain
  let returnObj = [];
  if (messageToBeBombed.reference) {
    let referencedMessageChannel = await guild.channels.fetch(messageToBeBombed.reference.channelId);
    let referencedMessage = await referencedMessageChannel.messages.fetch(messageToBeBombed.reference.messageId);
    returnObj = await buildMessage(referencedMessage);
  }
  let files = messageToBeBombed.attachments ? Array.from(messageToBeBombed.attachments.values()).map(v => v.attachment) : null


  returnObj.push({
    content: (messageToBeBombed.content ? messageToBeBombed.content : ""),
    username: (await messageToBeBombed.member)?.displayName || messageToBeBombed.author.username,
    avatarURL: (await messageToBeBombed.member)?.avatarURL() || (await messageToBeBombed.author)?.avatarURL(),
    embeds: messageToBeBombed.embeds,
    allowedMentions: { parse: [] },
    files: files,
    url: messageToBeBombed.url
  })
  return returnObj;
}

async function kesterBomb(inputObject) {
  const guild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)
  let channelToBeBombed = guild.channels.cache.get(inputObject.target.channelId);
  let messageToBeBombed = await channelToBeBombed.messages.fetch(inputObject.target.id);
  let messagesToSend = await buildMessage(messageToBeBombed);
  for (let index = 0; index < messagesToSend.length; index++) {
    const messageToSend = messagesToSend[index];


    let chunks = u.splitMessage(messageToSend.content)
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];

      messageToSend.content = ">>> " + chunk;
      if (index == chunks.length - 1) {
        messageToSend.content = messageToSend.content + "\n\n" + messageToSend.url;
      }


      try {
        await webhookUtil(guild.channels.cache.get(snowflakes.channels.kesterBomb), "kesterBombhook", "./avatar/base.png", messageToSend);
      } catch (error) {
        if (error.toString().indexOf("Missing Permission") > -1) {
          await u.errorLog.send({ embeds: [u.embed().setColor("PURPLE").setTitle("Missing Permission").setDescription("I don't have permission to send messages in <#" + snowflakes.channels.kesterBomb + ">. Please give me permission to send messages in that channel.")] });
        }
        else {
          throw error;
        }
      }

    }
  }


}


modRequest(Module, "Kester Bomb", snowflakes.emoji.messageContextMenu.kesterBomb, kesterBomb, kesterBomb);


module.exports = Module;