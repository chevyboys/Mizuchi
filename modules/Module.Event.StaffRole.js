const Augur = require("augurbot");
const snowflakes = require('../config/snowflakes.json');

async function isStaff(roleid) {
  return roleid == snowflakes.roles.Admin || snowflakes.roles.Moderator || snowflakes.roles.CommunityGuide;
}

const Module = new Augur.Module;
Module.addEvent('roleUpdate', async (role) => {

  if (await isStaff(role.roleid)) {
    await role.members.get();
  }

});

module.exports = Module;