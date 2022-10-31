const snowflakes = require("../config/snowflakes.json");
u = require("../utils/Utils.Generic");
const Augur = require("augurbot");
const Module = new Augur.Module;
const holidays = [
    {
        name: 'Halloween',
        description: "*T'was the night of all hallows eve when our brave adventurers gathered together in the climbers court. But as they sat down to dine together, they heard a dark laughter from hundreds of throats. It seems the mana construct makers had delved too deep, and released the spirits hidden in a dark chamber deep inside the code. A dark fate awaited the brave adventurers if they failed to trap each of the spirits.*",
        emoji: snowflakes.emoji.specter

    }
]








Module.addEvent("messageReactionAdd", async (reaction, user) => {
    if (reaction.emoji.name == holidays[0] && !user.bot) {
        let message = reaction.message;
        try {
            //nora handles a user "catching" a specter here
            //Should remove bot reaction
            //shold give shout out message
            //feel free to have fun with it.
        } catch (error) { u.errorHandler(error, "Holliday reaction error"); }
    }
}).addEvent("messageCreate", (msg) => {
    if (
        msg.author &&
        !msg.webhookId &&
        !msg.author.bot &&
        Math.floor(Math.random() * 30) > 28 //this should be a 1 in 30 chance
    ) {
        msg.react(holidays[0].emoji)
    }
})

module.exports = Module;