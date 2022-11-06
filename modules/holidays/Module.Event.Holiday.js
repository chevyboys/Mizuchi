const Augur = require("augurbot"),
  u = require("../../utils/Utils.Generic");
const snowflakes = require('../config/snowflakes.json');
const fs = require('fs');
const holidayFilePath = "./config/holidays.json",
  moment = require("moment");
const Module = new Augur.Module;



Module.addCommand({
  name: "refreshholidays",
  description: "Syncs the config with the google sheets",
  hidden: true,
  process: async function (msg) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, msg); }
  },
  permissions: (msg) => Module.config.adminId.includes(msg.author.id)
}).addCommand({
  name: "sendholidaymsg",
  description: "Sends the holiday message in the current configuration.",
  hidden: true,
  process: async function (msg) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, msg); }
  },
  permissions: (msg) => Module.config.adminId.includes(msg.author.id)
}).addCommand({
  name: "startholiday",
  description: "Starts the holiday manually",
  hidden: true,
  process: async function (msg) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, msg); }
  },
}).addCommand({
  name: "endholiday",
  description: "Ends the holiday manually",
  hidden: true,
  process: async function (msg) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, msg); }
  },
})

module.exports = Module;