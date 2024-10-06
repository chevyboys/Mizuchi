const Augur = require("augurbot");
const snowflakes = require("../config/snowflakes.json");
//const fs = require('fs');
//const config = require('../../config/config.json');
//const u = require('../../utils/Utils.Generic');
const event = require("../../modules/PristineWaters/utils");
const odds = event.odds;
const ParticipantManager = require("../modules/Halloween2024/Participant");
// const NPCSend = require("../../modules/PristineWaters/NPC");
// const moment = require("moment");
// const manipulateImage = require('../../modules/PristineWaters/imageManipulation');
// const embedColor = event.colors.find(c => c.name.toLowerCase().includes("blurple")).color || event.colors[event.colors.length - 1].color;
const endedButNotCleaned = false;

const Participants = new ParticipantManager();

const Module = new Augur.Module();

//active should be set based on a file in the same directory as pristine waters called active.json. if it doesn't exist, it should be created with the value of false
//if active.json exists
let active;
if (!fs.existsSync('./data/holiday/active.json')) {
  fs.writeFileSync('./data/holiday/active.json', JSON.stringify({ active: false }));
  active = false;
} else {
  active = require('../../data/holiday/active.json').active;
}

//if active.json is true, set active to true
function setActive(bool) {
  active = bool;
  fs.writeFileSync('./data/holiday/active.json', JSON.stringify({ active: bool }));
}

//############### Functions ################
async function begin() {
  //TODO: Implement this function
  // TODO: Event build and teardown
  //    TODO: Send announcement
  //    TODO:   Create / Rename roles
  //    TODO: Set role colors
  //    TODO: Unset colors
  //    TODO:   Delete / Unname roles
  //    TODO: Starting announcement
  //    TODO: Guid to disable emoji
  //    TODO: Explanation of events
  //    TODO: Lore explanation
  //    TODO: Ebbing of the tides(Celebrates birth and death)
  //    TODO: Explaining that spam will not help you
  //    TODO: Clarify that there is NOT a lore drop this event
  //    TODO: Mod starting message
  //    TODO: Going over mod powers
  //See https://docs.google.com/document/d/1p6DZ28IPDP8wNqNs-IUN_HjogpcMK7b5W7Auvm9NHq8/edit

}

async function end() {
  //TODO: Implement this function
}

async function dailyReset() {
  //TODO: Implement this function
}



//################ Module adds ################

Module.addEvent("reactionAdd", async (reaction, user) => {
  // TODO: handle receiving a reaction
}).addInteractionCommand({
  name: "holiday",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    //TODO: Do something if the event is not yet active


    //TODO: Implement this function
    //Handle subcommands
    switch (interaction.options.getSubcommand()) {
      case "inventory":
      case "leaderboard":
      case "admin":
      case "help":
      case "gift":
        break;
    }
  }
}).setClockwork(() => {
  //TODO: Implement this function
  //Handle daily reset
  //Handle end of event
})

//TODO: Add the ability to start the event
//TODO: Add the ability to end the event manually for testing
//TODO: Add the ability to reset the event daily manually for testing
//TODO: Add the ability for admins to trigger flurries (might go in reactionAdd)
//TODO: Add the ability for users to send and receive cards with adminLogging
//TODO: Add automatic slash command registration








module.exports = Module;