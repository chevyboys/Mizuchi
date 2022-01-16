const Augur = require("augurbot"),
    u = require("../utils/Utils");
const modRequest = require('../utils/Utils.ContextMenu.Message.ModCard');


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

const Module = new Augur.Module()
modRequest(Module, "Pin", "📌", pinMsgApprove, pinMsgOverride);

module.exports = Module;