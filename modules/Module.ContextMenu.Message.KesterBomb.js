const Augur = require("augurbot"),
    modRequest = require('../utils/Utils.ContextMenu.Message.ModCard'),
    Discord = require("discord.js"),
    config = require("../config/config.json"),
    snowflakes = require("../config/snowflakes.json");

//Kester msg handling
async function kesterBomb(inputObject) {
    let msg = inputObject.target
    let newMessage;
    if (msg.content.length > 0) {
        newMessage = {
            content: `${msg.content}`
        }
    }
    else {
        newMessage = {
        }
    }
    if (msg.embeds) {
        newMessage.embeds = msg.embeds
        for (const embed of newMessage.embeds) {
            embed.description = `${embed.description}`;
            for (const field of embed.fields) {
                field.value = `${field.value}`;
            }
        }
    }
    if (msg.attachments?.size > 0)
        newMessage.files = [msg.attachments?.first()?.url]
    newMessage.components = msg.components;
    //Use the target's Avatar and Name
    newMessage.username = inputObject.interaction?.member.displayName || msg.member.displayName;
    newMessage.avatarURL = inputObject.interaction?.member.avatarURL({format:'png'}) || msg.member.avatarURL({format:'png'});  

    const kesterBombHook = new Discord.WebhookClient(config.kesterBombs)
    kesterBombHook.send(newMessage)

}

const Module = new Augur.Module()
modRequest(Module, "Kester Bomb", snowflakes.emoji.messageContextMenu.kesterBomb, kesterBomb, kesterBomb);


module.exports = Module;