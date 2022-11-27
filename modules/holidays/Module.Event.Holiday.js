const Augur = require("augurbot"),
  { DateEmitter } = require('../../utils/Utils.DateEvent.js'),
  u = require('../../utils/Utils.Generic.js');

const snowflakes = require('../config/snowflakes.json');
const holidayData = "./config/holidays.json";



const zip = (a, b) => a.map((k, i) => [k, b[i]]);


const Module = new Augur.Module;
Module.setInit(async () => {

}).addInteractionCommand({
  name: "refresh holidays",
  description: "Syncs the config with the google sheets",
  hidden: true,
  process: async function (interaction) {
    try {
      //get


    } catch (e) { u.errorHandler(e, interaction); }
  },
  permissions: (interaction) => Module.config.adminId.includes(interaction.author.id)
}).addInteractionCommand({
  name: "send holiday message",
  description: "Sends the holiday message in the current configuration.",
  hidden: true,
  process: async function (interaction) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, interaction); }
  },
  permissions: (interaction) => Module.config.adminId.includes(interaction.author.id)
}).addInteractionCommand({
  name: "startHoliday",
  description: "Starts the holiday manually",
  hidden: true,
  process: async function (interaction) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, interaction); }
  },
}).addInteractionCommand({
  name: "endHoliday",
  description: "Ends the holiday manually",
  hidden: true,
  process: async function (interaction) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, interaction); }
  },
}).addInteractionCommand({
  name: "holiday info",
  description: "Grabs the current holiday or recently elapsed holiday with information on how to add your own.",
  hidden: false,
  process: async function (interaction) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, interaction); }
  },
})


module.exports = Module;