const Augur = require("augurbot"),
    u = require("../utils/Utils.Generic");
const modRequest = require('../utils/Utils.ContextMenu.Message.ModCard');
const snowflakes = require('../config/snowflakes.json')

//Spoiler msg handling
async function spoilerMsg(inputObject) {
    let msg = inputObject.target;
    let introduction = "";
    if (msg.author != Module.client.user) introduction = msg.member.displayName + " says: ";
    let newMessage;
    if (msg.content.length > 0) {
        newMessage = {
            content: `${introduction}||${msg.content}||`
        }
    }
    else {
        newMessage = {
        }
    }
    if (msg.embeds) {
        newMessage.embeds = msg.embeds
        for (const embed of newMessage.embeds) {
            embed.description = `||${embed.description}||`;
            for (const field of embed.fields) {
                field.value = `||${field.value}||`;
            }
        }
    }
    if (msg.attachments?.size > 0)
        newMessage.files = [msg.attachments?.first()?.url]
    newMessage.components = msg.components;
    msg.channel.send(newMessage);
    //u.clean(msg, 0);
}

const Module = new Augur.Module()
modRequest(Module, "Spoiler", snowflakes.emoji.spoiler, spoilerMsg, spoilerMsg);
module.exports = Module;