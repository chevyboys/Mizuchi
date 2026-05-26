const Augur = require("augurbot");
const Module = new Augur.Module();
const db = require("../utils/Utils.Database.js");
const { DBGuildRoleObject } = require("../utils/Utils.Database.js");
const utils = require("../utils/Utils.Generic.js");

async function syncRoles() {
  for (const [guildId, guild] of Module.client.guilds.cache) {
    const dbGuild = await db.Guild.get(guildId);
    if (!dbGuild) continue; // if we don't have a database entry for this guild, skip it.

    let syncRoles = await DBGuildRoleObject.get_all_slave_roles_for_guild(dbGuild.id);
    if (syncRoles.length === 0) continue; // if there are no slave roles in this guild, skip it.

    await guild.members.fetch().catch(() => { });

    for (const db_roles of syncRoles) {
      let membersToSync = await db_roles.slave.get_master_role_members();

      let guildRole = await guild.roles.fetch(db_roles.slave.snowflake);
      if (!guildRole) continue;

      let membersWithRole = guildRole.members.map(member => member.id);

      // remove any members from membersToSync that already have the role
      membersToSync = membersToSync.filter(memberId => !membersWithRole.includes(memberId));

      // remove the role from any members that shouldn't have it
      for (const memberId of membersWithRole) {
        if (!membersToSync.includes(memberId)) {
          let member = guild.members.cache.get(memberId) || await guild.members.fetch(memberId).catch(() => null);
          if (!member) continue;

          await member.roles.remove(db_roles.slave.snowflake).catch(err => {
            utils.log(`Failed to remove role ${db_roles.slave.snowflake} from member ${memberId} in guild ${guildId}: ${err}`);
          });
        }
      }

      // add the role to new members
      for (const memberId of membersToSync) {
        // 🔴 FIX: Check cache first, if missing, reach out to Discord's API directly
        let member = guild.members.cache.get(memberId) || await guild.members.fetch(memberId).catch(() => null);
        if (!member) continue;

        await member.roles.add(db_roles.slave.snowflake).catch(err => {
          utils.log(`Failed to add role ${db_roles.slave.snowflake} to member ${memberId} in guild ${guildId}: ${err}`);
        });
      }
    }
  }
  return true;
}

async function update_sync_role_members() {
  let count = 0;

  for (const [guildId, guild] of Module.client.guilds.cache) {
    const dbGuild = await db.Guild.get(guildId);
    if (!dbGuild) continue;
    await guild.members.fetch().catch(() => { });

    for (const dbRole of dbGuild.roles) {
      if (dbRole.slave_role_id) {
        let guildRole = await guild.roles.fetch(dbRole.snowflake);
        if (!guildRole) continue;

        let membersWithRole = guildRole.members.map(member => member.id);

        for (const memberId of membersWithRole) {
          let member = guild.members.cache.get(memberId) || await guild.members.fetch(memberId).catch(() => null);
          if (!member) continue;

          await db.User.sync_roles(member);
          count++;
        }
      }
    }
  }
  return count;
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
    await msg.react("⏳").catch(() => { });

    await update_sync_role_members();
    let success = await syncRoles();

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

    // FIX: Await reactions and catch errors to prevent silent execution breaks
    await msg.react("⏳").catch(() => { });

    let dbGuilds = await db.Guild.getAll();

    //react with a 1 to indicate step 1 is complete (finding the roles in the database)
    await msg.react("1️⃣").catch(() => { });

    //verify that both roles exist in the database
    let masterRole;
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

    await msg.react("2️⃣").catch(() => { });

    await slaveRole.add_master_role(masterRole.snowflake);

    await msg.react("3️⃣").catch(() => { });

    await update_sync_role_members();
    await syncRoles();

    msg.channel.send(`Roles ${masterRole.friendly_name} and ${slaveRole.friendly_name} are now synced. Whenever the members of ${masterRole.friendly_name} are updated, the members of ${slaveRole.friendly_name} will be updated to match.`);
  }
});
module.exports = Module;