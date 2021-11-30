const Augur = require("augurbot"),
    u = require("../utils/utils");
const modRequest = require('../utils/modRequest');
const Discord = require("discord.js"),
config = require("../config/config.json");


//Pin msg handling
async function pinMsgApprove(inputObject) {
    let messages = await inputObject.target.channel.messages.fetchPinned().catch(u.noop);
    if (messages?.size == 50) {
        if (inputObject.embed) {
            inputObject.embed.setDescription(`${requestingUser}, I was unable to pin the message since the channel pin limit has been reached.`);
            inputObject.embed.setColor(0xFF0000);
            inputObject.activeRequest.originalInteraction.editReply("Approved by " + mod.displayName)
        }
    }
    else inputObject.target.pin(`Requested by ${inputObject.requestingUser.displayName}`);
}

async function pinMsgOverride(inputObject) {
    let messages = await inputObject.target.channel.messages.fetchPinned().catch(u.noop);
    if (messages?.size == 50) return inputObject.interaction.editReply({ content: `${inputObject.user}, I was unable to pin the message since the channel pin limit has been reached.`, ephemeral: true });
    else inputObject.target.pin(`Requested by ${inputObject.user.username}`);
    inputObject.interaction.editReply({ content: `I have pinned the message for you`, ephemeral: true });
}
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
//Kester msg handling
async function kesterBomb(inputObject){
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
    const kesterBombHook = new Discord.WebhookClient(config.kesterBombs)
    kesterBombHook.send(newMessage)
    
}

const Module = new Augur.Module().setInit(() => {
    modRequest(Module, "Spoiler", "🤫", spoilerMsg, spoilerMsg);
    modRequest(Module, "Pin", "📌", pinMsgApprove, pinMsgOverride);
    modRequest(Module, "Kester Bomb", "💣", kesterBomb, kesterBomb);
    //modRequest(Module, "Kester Bomb", )
})

module.exports = Module;