const Augur = require("augurbot");
const Module = new Augur.Module();
const db = require("../utils/Utils.Database.js");
const { DBGuildRoleObject } = require("../utils/Utils.Database.js");
const utils = require("../utils/Utils.Generic.js");

function syncRoles() {
  //For every guild we are currently in, check if that guild has any slave roles that need to be updated, and if so, update them.
  Module.client.guilds.cache.forEach(async guild => {
    const guildId = guild.id;
    const dbGuild = db.Guild.get(guildId);
    if (!dbGuild) return; // if we don't have a database entry for this guild, skip it.
    let syncRoles = await DBGuildRoleObject.get_all_slave_roles_for_guild(dbGuild.id);
    if (syncRoles.length === 0) return; // if there are no slave roles in this guild, skip it.
    syncRoles.forEach(async db_roles => {
      let membersToSync = await db_roles.slave.get_master_role_members();

      let guildRole = await guild.roles.fetch(db_roles.slave.snowflake);
      let membersWithRole = guildRole.members.map(member => member.id);

      //remove any members from membersToSync that already have the role, so we don't waste time trying to add the role to them again.
      membersToSync = membersToSync.filter(memberId => !membersWithRole.includes(memberId));

      //remove the role from any members that have it
      membersWithRole.forEach(memberId => {
        if (!membersToSync.includes(memberId)) {
          let member = guild.members.cache.get(memberId);
          if (!member) return; // if the member isn't in the guild, skip them.
          member.roles.remove(db_roles.slave.discord_role_id).catch(err => {
            utils.log(`Failed to remove role ${db_roles.slave.discord_role_id} from member ${memberId} in guild ${guildId}: ${err}`);
          });
        }
      });

      membersToSync.forEach(memberId => {
        let member = guild.members.cache.get(memberId);
        if (!member) return; // if the member isn't in the guild, skip them.
        member.roles.add(db_roles.slave.discord_role_id).catch(err => {
          utils.log(`Failed to add role ${db_roles.slave.discord_role_id} to member ${memberId} in guild ${guildId}: ${err}`);
        });
      });

    });
  });
  return true;
}

async function update_sync_role_members() {
  let membersSynced = [];
  Module.client.guilds.cache.forEach(async guild => {
    const guildId = guild.id;
    const dbGuild = await db.Guild.get(guildId);
    if (!dbGuild) return; // if we don't have a database entry for this guild, skip it.
    console.log(dbGuild);
    dbGuild.roles.forEach(async dbRole => {
      if (dbRole.slave_role_id) {
        let guildRole = await guild.roles.fetch(dbRole.snowflake);
        let membersWithRole = guildRole.members.map(member => member.id);
        membersWithRole.forEach(async memberId => {
          let member = guild.members.cache.get(memberId);
          if (!member) return; // if the member isn't in the guild, skip them.
          membersSynced.push(await db.User.sync_roles(member));
        });
      }
    });
  });
  return Promise.all(membersSynced);
}

const secondsInAMinute = 60
const secondsInAnHour = 60 * secondsInAMinute;
const hours = 1;

Module.setClockwork(async () => {

  await update_sync_role_members();
  return syncRoles();

}, 1000 * secondsInAnHour * hours);

Module.addCommand({
  name: "syncroles",
  category: "Bot Admin",
  hidden: true,
  description: "Manually trigger a sync of all roles that are set to be synced. This is automatically triggered every hour.",
  permissions: (msg) => (Module.config.ownerId === (msg.author.id)) || msg.member.roles.cache.has(Module.config.snowflakes.roles.BotMaster) || msg.member.roles.cache.has(Module.config.snowflakes.roles.BotAssistant),
  process: async function (msg, suffix) {
    await update_sync_role_members();

    let success = syncRoles();
    if (success) {
      msg.channel.send("Roles synced successfully.");
    } else {
      msg.channel.send("An error occurred while syncing roles. Check the logs for more details.");
    }
  }
}).addCommand({
  name: "addsyncedrole",
  category: "Bot Admin",
  hidden: false,
  description: "Add a role to be synced with another role. Usage: !addsyncedrole <master role> <slave role>. Whenever the members of the master role are updated, the members of the slave role will be updated to match.",
  permissions: (msg) => (Module.config.ownerId === (msg.author.id)) || msg.member.roles.cache.has(Module.config.snowflakes.roles.BotMaster) || msg.member.roles.cache.has(Module.config.snowflakes.roles.BotAssistant),
  process: async function (msg, suffix) {
    let [masterRoleMention, slaveRoleMention] = suffix.split(" ");
    if (!masterRoleMention || !slaveRoleMention) {
      msg.channel.send("You must provide both a master role and a slave role. Usage: !addsyncedrole <master role> <slave role>");
      return;
    }
    let firstRoleId = masterRoleMention.replace(/<@&(\d+)>/, "$1");
    let secondRoleId = slaveRoleMention.replace(/<@&(\d+)>/, "$1");
    if (!firstRoleId || !secondRoleId) {
      msg.channel.send("Invalid role mentions. Make sure to mention the roles you want to sync. Usage: !addsyncedrole <master role> <slave role>");
      return;
    }


    let dbGuilds = await db.Guild.getAll();
    //verify that both roles exist in the database
    /** 
      * @type {DBGuildRoleObject}
     */
    let masterRole;
    /**
      * @type {DBGuildRoleObject}
     */
    let slaveRole;
    dbGuilds.forEach(dbGuild => {
      dbGuild.roles.forEach(dbRole => {
        if (dbRole.snowflake == firstRoleId) {
          masterRole = dbRole;
        }
        if (dbRole.snowflake == secondRoleId) {
          slaveRole = dbRole;
        }
      });
    });

    if (!masterRole || !slaveRole) {
      msg.channel.send("One or both of the roles do not exist in the database. Make sure both roles are added to the database before syncing.");
      return;
    }

    await slaveRole.add_master_role(masterRole.snowflake);


    await update_sync_role_members();
    await syncRoles();

    msg.channel.send(`Roles ${masterRole.name} and ${slaveRole.name} are now synced. Whenever the members of ${masterRole.name} are updated, the members of ${slaveRole.name} will be updated to match. (within the next hour, or you can trigger an immediate sync with !syncroles in the master guild, then the slave guild)`);

  }
});
module.exports = Module;

