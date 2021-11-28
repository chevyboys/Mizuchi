const Augur = require("augurbot"),
u = require("../utils/utils");
const modRequest = require('../utils/modRequest');

// Message context menu for mods spoilering things

async function spoilerMsg(inputObject) {
  let msg = inputObject.target;
  let introduction = "";
  if (msg.author != Module.client.user) introduction = msg.member.displayName + " says: ";
  let newMessage;
  if(msg.content.length > 0) {
      newMessage = {
          content: `${introduction}||${msg.content}||`
      }
  }
  else {
      newMessage = {
      }
  }
  if(msg.embeds){
      newMessage.embeds = msg.embeds
      for (const embed of newMessage.embeds) {
         embed.description = `||${embed.description}||`;
         for (const field of embed.fields) {
              field.value = `||${field.value}||`;
         }
      }
  }
  if(msg.attachements && msg.attachements.length > 0){
      newMessage.attachements = msg.attachements;
      for (const attachement of newMessage.attachements ) {
              attachement.setName("SPOILER_" + attachement.name);
      }
  }
  newMessage.files = msg.files;
  newMessage.components = msg.components;
  msg.channel.send(newMessage);
  u.clean(msg, 0);
}

const Module = async () => await modRequest("Spoilers", "🤫", spoilerMsg, spoilerMsg);

module.exports = Module;