const Augur = require("augurbot"),
  { DateEmitter } = require('../../utils/Utils.DateEvent');

const snowflakes = require('../config/snowflakes.json');
const fs = require('fs');
const holidayData = "./config/holidays.json";



const zip = (a, b) => a.map((k, i) => [k, b[i]]);


const Module = new Augur.Module;
const emitter = new DateEmitter();

Module.addEvent("ready", async () => {
  holidayData.forEach((holiday) => {
    emitter.push(holiday.date, "holiday", holiday.name);
  })
}).addCommand({
  name: "refreshHolidays",
  description: "Syncs the config with the google sheets",
  hidden: true,
  process: async function (msg) {
    try {
      //get


    } catch (e) { u.errorHandler(e, msg); }
  },
  permissions: (msg) => Module.config.adminId.includes(msg.author.id)
}).addCommand({
  name: "sendHolidaymsg",
  description: "Sends the holiday message in the current configuration.",
  hidden: true,
  process: async function (msg) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, msg); }
  },
  permissions: (msg) => Module.config.adminId.includes(msg.author.id)
}).addCommand({
  name: "startHoliday",
  description: "Starts the holiday manually",
  hidden: true,
  process: async function (msg) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, msg); }
  },
}).addCommand({
  name: "endHoliday",
  description: "Ends the holiday manually",
  hidden: true,
  process: async function (msg) {
    try {
      // TODO
    } catch (e) { u.errorHandler(e, msg); }
  },
})

emitter.on('holiday', (callback) => {
  //execute start holiday here

  startHoliday(callback);
});

module.exports = Module;