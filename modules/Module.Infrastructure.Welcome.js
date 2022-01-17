const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  db = require("../utils/Utils.Database")

const Module = new Augur.Module()
.addEvent("guildMemberAdd", async (member) => {
  try {
      //Make sure we are in the primary server
      //Notify Mods that a new user is here
      //  - If they are returning, Notify them of all the roles the person should be granted
      // Send a greeting in the introductions channel if the person is new
      //add the person to the database

  } catch(e) { u.errorHandler(e, "New Member Add"); }
});

module.exports = Module;