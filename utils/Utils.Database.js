const mysql = require("mysql2/promise"); // Updated to mysql2
const Discord = require("discord.js");
const { errorHandler } = require("./Utils.Error");
const get = require("./Utils.GetGoogleSheetsAsJson");

let hasBeenInitialized = false;
/**
 * This file is responsible for all interactions with the database, and contains utility functions for parsing and validating data related to the database. It also contains the data models for the database, such as the DBUserObject, which represents a user in the database and contains methods for updating that user's information in the database. The DataBaseActions object contains methods for interacting with the database, such as getting a user or updating a user's information. The database connection is established using mysql2/promise, and all queries are executed using prepared statements to prevent SQL injection.
 */
let client; // this will hold our AugurClient instance, which we need for some of the utility functions. We have to declare it here to avoid circular dependencies, but the init function will set it to the actual client instance when it's called from bot.js
let pool; // This will hold our connection pool
//TODO: Switch to the connection pool for all queries

const DISCORD_EPOCH = 1420070400000; // Constant for Snowflake validation
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

/** 
 * Utility to clean strings for DB safety/readability 
 */
function cleanString(str) {
  return str ? str.replace(/[\W_]+/g, " ").trim() : "";
}

/** 
 * Validates if a string is a valid Discord Snowflake 
 */
function assertIsSnowflake(snowflake) {
  if (!snowflake || typeof snowflake !== 'string' || !/^\d+$/.test(snowflake)) return false;
  try {
    const timestamp = Number((BigInt(snowflake) >> 22n) + BigInt(DISCORD_EPOCH));
    return timestamp > DISCORD_EPOCH && timestamp <= Date.now();
  } catch {
    return false;
  }
}

/** 
 * Validates Cake Day format (e.g., "Jan 01" or "opt-out")
 */
function assertIsCakeDay(string) {
  if (string === "opt-out") return true;
  if (!string || typeof string !== 'string') return false;

  const parts = string.split(" ");
  if (parts.length === 2 && months.includes(parts[0]) && days.includes(parts[1])) {
    return true;
  }
  return false;
}

/** 
 * Resolves various object types into a raw Snowflake string
 */
function parsesnowflake(snowflakeResolvable) {
  const snowflake = snowflakeResolvable?.id || snowflakeResolvable?.snowflake?.user?.id || snowflakeResolvable?.snowflake?.snowflake || snowflakeResolvable?.snowflake || snowflakeResolvable?.Id || snowflakeResolvable;
  if (!assertIsSnowflake(snowflake)) {
    throw new Error(`INVALID DISCORD SNOWFLAKE: ${JSON.stringify(snowflakeResolvable)}`);
  }
  return snowflake;
}

/** 
 * Normalizes role data from the legacy JSON field or provided objects
 */
function normalizeRolesByGuild(rolesData) {
  let parsedRoles = rolesData;
  if (typeof parsedRoles === "string") {
    try { parsedRoles = JSON.parse(parsedRoles); } catch { parsedRoles = []; }
  }

  // Legacy support: If it's just an array, treat it as roles for the primary guild
  if (Array.isArray(parsedRoles)) {
    parsedRoles = {
      [client.config.snowflakes.guilds.PrimaryServer]: parsedRoles
    };
  }

  if (!parsedRoles || typeof parsedRoles !== "object") return {};

  let normalized = {};
  for (const [guildID, guildRoles] of Object.entries(parsedRoles)) {
    if (!assertIsSnowflake(guildID)) continue;
    normalized[guildID] = Array.isArray(guildRoles) ? guildRoles.filter(assertIsSnowflake) : [];
  }
  return normalized;
}

/**
 * Data Model for User interactions
 * @member {Discord.Snowflake} snowflake the id of the user to store
 * @member {string} username the username of the user to store, stored for ease of use in the database and testing, should not be referenced in code
 * @member {string} cakeday the MM-DD formatted day to celebrate this person, or "opt-out" if they have chosen to opt out of cake day celebrations
 * @member {string} cakeyear the year the user joined to get seniority, stored as a string to allow null values and avoid timezone issues
 * @member {Object} roles an object representing the user's roles across different guilds
 */
class DBUserObject {
  #id = null;
  #snowflake = "";
  #username = "";
  #cakeday = "opt-out";
  #cakeyear = new Date().getFullYear().toString();
  #roles = {}; // { guildSnowflake: [roleSnowflake, roleSnowflake] }


  constructor(constructionObj) {
    if (constructionObj instanceof DBUserObject) return constructionObj;

    this.#id = constructionObj.id || null;
    this.#snowflake = parsesnowflake(constructionObj.snowflake);
    this.#username = cleanString(constructionObj.username) || "Unknown User";

    // Validate Cake Day, default to "opt-out" if invalid/missing
    this.#cakeday = assertIsCakeDay(constructionObj.cakeday) ? constructionObj.cakeday : "opt-out";
    this.#cakeyear = parseInt(constructionObj.cakeyear) || new Date().getFullYear();

    // This maintains legacy roles while we migrate to the relational tables
    this.#roles = normalizeRolesByGuild(constructionObj.roles);
  }

  /**
   * Getters and setters
   */
  get id() {
    return this.#id;
  }

  get snowflake() {
    return this.#snowflake;
  }

  get username() {
    return this.#username;
  }

  get cakeday() {
    return this.#cakeday;
  }

  get cakeyear() {
    return this.#cakeyear;
  }

  get roles() {
    return this.#roles;
  }



  /**
   * Refreshes user data from DB
   */
  async get(guildsnowflake) {
    let user = await DataBaseActions.User.get(this.#snowflake, guildsnowflake);
    if (!user) throw new Error(`User with snowflake ${this.#snowflake} not found in DB for guild ${guildsnowflake}`);
    this.#username = user.username;
    this.#cakeday = user.cakeday;
    this.#cakeyear = user.cakeyear;
    this.#roles = user.roles;
    return user ? user : this; // Return the fresh DB object, or the current object if not found in DB
  }

  async updateCakeDay(cakeday, guildsnowflake) {
    if (!assertIsCakeDay(cakeday)) throw new Error("Invalid Cake Day format");
    let user = await privateDataBaseActions.User.update({ snowflake: this.#snowflake, cakeday }, guildsnowflake);
    this.#cakeday = user.cakeday;
    return this;
  }

  async updateCakeYear(cakeyear, guildsnowflake) {
    const year = parseInt(cakeyear);
    if (isNaN(year)) throw new Error("Invalid Cake Year");
    let user = await privateDataBaseActions.User.update({ snowflake: this.#snowflake, cakeyear: year }, guildsnowflake);
    this.#cakeyear = user.cakeyear;
    return this;
  }

  async updateRoles(guildsnowflake) {
    const guild = await client.guilds.fetch(guildsnowflake);
    const member = await guild.members.fetch(this.#snowflake);
    let user = await privateDataBaseActions.User.update({ snowflake: this.#snowflake, roles: member.roles.cache.map(r => r.id) }, guildsnowflake);
    this.#roles = user.roles;
    return this;
  }
}

/**
 * Data Model for Guilds
 * @member {Discord.Snowflake} snowflake the id of the guild to store
 * @member {string} friendly_name a human friendly name for the guild, stored for ease of use in the database and testing, should not be referenced in code
 * @member {boolean} isTestGuild whether this guild is a test guild or not.
 * @member {DBGuildRoleObject[]} roles an array of the guild roles in this guild. This will be referenced by the user_guild_role table for restoring roles; It is not perfect;
 */
class DBGuildObject {
  #id = null;
  #snowflake = "";
  #friendly_name = "";
  #isTestGuild = false;
  #roles = [];

  constructor(constructionObj) {
    if (constructionObj instanceof DBGuildObject) return constructionObj;

    this.#id = constructionObj.id || null;
    this.#snowflake = parsesnowflake(constructionObj.snowflake);
    this.#friendly_name = cleanString(constructionObj.friendly_name);
    this.#isTestGuild = !!constructionObj.isTestGuild;
    this.#roles = Array.isArray(constructionObj.roles)
      ? constructionObj.roles.map(role => new DBGuildRoleObject(role))
      : [];
  }

  // Getters and setters
  get id() {
    return this.#id;
  }

  get snowflake() {
    return this.#snowflake;
  }

  get friendly_name() {
    return this.#friendly_name;
  }

  get isTestGuild() {
    return this.#isTestGuild;
  }
  /**
   * @return {DBGuildRoleObject[]}
   */

  get roles() {
    return this.#roles;
  }
}
/**
 * Data Model for Roles
 * @member {Discord.Snowflake} snowflake the id of the role to store
 * @member {string} friendly_name a human friendly name for the role, stored for ease of use in the database and testing, should not be referenced in code
 * @member {boolean} has_redacted_info whether the role has redacted information
 * @member {boolean} is_update_role whether the role is an update role
 * CREATE TABLE `guild_role` (
  `id` double NOT NULL AUTO_INCREMENT,
  `guild_id` double NOT NULL,
  `snowflake` varchar(100) NOT NULL,
  `has_redacted_info` tinyint(1) NOT NULL DEFAULT 0,
  `is_update_role` tinyint(1) NOT NULL DEFAULT 0,
  `friendly_name` varchar(100) NOT NULL,
  `slave_role_id` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `guild_role_unique` (`snowflake`),
  KEY `guild_role_guild_FK` (`guild_id`),
  KEY `guild_role_guild_role_FK` (`slave_role_id`),
  CONSTRAINT `guild_role_guild_FK` FOREIGN KEY (`guild_id`) REFERENCES `guild` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `guild_role_guild_role_FK` FOREIGN KEY (`slave_role_id`) REFERENCES `guild_role` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22153 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
 */
class DBGuildRoleObject {
  #id = null;
  #snowflake = "";
  #friendly_name = "";
  #has_redacted_info = false;
  #is_update_role = false;
  #slave_role_id = null; // the internal database id of a role that should have it's members updated to match the members of this role.
  constructor(constructionObj) {
    if (constructionObj instanceof DBGuildRoleObject) return constructionObj;
    this.#id = constructionObj.id || null;
    this.#snowflake = parsesnowflake(constructionObj.snowflake);
    this.#friendly_name = cleanString(constructionObj.friendly_name) || "Unknown Role";

    // Explicitly parse these as booleans so they never default to undefined
    this.#has_redacted_info = !!constructionObj.has_redacted_info;
    this.#is_update_role = !!constructionObj.is_update_role;
    this.#slave_role_id = constructionObj.slave_role_id;
  }

  get id() {
    return this.#id;
  }

  get snowflake() {
    return this.#snowflake;
  }

  get friendly_name() {
    return this.#friendly_name;
  }

  get has_redacted_info() {
    return this.#has_redacted_info;
  }

  get is_update_role() {
    return this.#is_update_role;
  }

  get slave_role_id() {
    return this.#slave_role_id;
  }

  /**
   * 
   * @returns {Discord.Snowflake[]}
   */

  async get_master_role_members() {
    //get roles that have this role as their slave role from the guild_role table
    const [rows] = await pool.execute(`SELECT id FROM guild_role WHERE slave_role_id = ?`, [this.#id]);
    let members = [];
    //convert rows to a comma delimited string for use in the next query
    const roleIds = rows.map(row => row.id).join(',');
    if (!roleIds) return members;
    const [memberRows] = await pool.execute(`SELECT u.snowflake FROM user_guild_role ugr LEFT JOIN users u ON ugr.user_id = u.id WHERE ugr.guild_role_id IN (${roleIds})`);
    members = memberRows.map(row => row.snowflake);
    return members;
  }

  async add_master_role(snowflake) {
    //find the master role to make sure it exists and get its id
    const [masterRoleRows] = await pool.execute(`SELECT id FROM guild_role WHERE snowflake = ?`, [snowflake]);
    if (masterRoleRows.length === 0) {
      throw new Error(`Master role with snowflake ${snowflake} not found`);
    }
    const masterRoleId = masterRoleRows[0].id;
    // Update the master role to have a reference to this role as its slave role
    await pool.execute(`UPDATE guild_role SET slave_role_id = ? WHERE id = ?`, [this.#id, masterRoleId]);
    return true;
  }

  async remove_master_role(snowflake) {
    //find the master role to make sure it exists and get its id
    const [masterRoleRows] = await pool.execute(`SELECT id FROM guild_role WHERE snowflake = ?`, [snowflake]);
    if (masterRoleRows.length === 0) {
      throw new Error(`Master role with snowflake ${snowflake} not found`);
    }
    const masterRoleId = masterRoleRows[0].id;
    // Update the master role to remove the reference to this role as its slave role
    await pool.execute(`UPDATE guild_role SET slave_role_id = NULL WHERE id = ?`, [masterRoleId]);
    return true;
  }


  /**
   * 
   * @param {number} guildId 
   * @returns {Promise<{slave: DBGuildRoleObject, master: DBGuildRoleObject}[]>}
   */

  static async get_all_slave_roles_for_guild(guildId) {
    const [rows] = await pool.execute(
      {
        nestedTables: true,
        sql: `SELECT slave.id as slave_id, master.id as master_id, slave.guild_id as slave_guild_id, master.guild_id as master_guild_id FROM guild_role master LEFT JOIN guild_role slave ON slave.id = master.slave_role_id WHERE slave.guild_id = ?`,
      },
      [guildId]);
    console.log(rows);
    let roles = [];
    rows.forEach(async (row) => {
      let this_roles_member = {
        slave: null,
        master: null,
      }
      let slaveGuild = await privateDataBaseActions.Guild.get_by_internal_id(row.slave_guild_id);
      let masterGuild = await privateDataBaseActions.Guild.get_by_internal_id(row.master_guild_id);
      if (!slaveGuild || !masterGuild) return; // if either guild isn't found, skip this row
      slaveGuild.roles.forEach(slave_guild_role => {
        if (slave_guild_role.id === row.slave_id) {
          this_roles_member.slave = slave_guild_role;
        }
      });
      masterGuild.roles.forEach(master_guild_role => {
        if (master_guild_role.id === row.master_id) {
          this_roles_member.master = master_guild_role;
        }
      });
      roles.push(this_roles_member);
    });
    return roles;
  }

}

let privateDataBaseActions = {
  User: {
    /**
             * Update will find a user and update their records, or if the user doesn't exist, it will create them, then update them
             * @param {Object} userData - An object containing member variables named each column you wish to change for the user, with the values equalling the new value.
             * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} userData.snowflake - The ID of the user to find, or an object that has an ID;
             * @param {string} [userData.cakeday] - the MM-DD formatted day to celebrate this person
             * @param {string} [userData.cakeyear] - the year the user joined to get seniority
             * @param {Object.<string, DBGuildRoleObject[]>|DBGuildRoleObject[]} [userData.roles] - an object representing the user's roles across different guilds, with guild snowflakes as keys and arrays of role snowflakes as values. If this is included, it will overwrite all existing role data for this user in the database, so be sure to include all roles you wish to keep in this object. If you only want to update specific guilds, you can set other guilds to their existing values from the database.
             */
    update: async (userData, guildSnowflake) => {
      const snowflake = parsesnowflake(userData);

      // 1. Ensure user exists and get current DB state
      let user = await DataBaseActions.User.get(snowflake, guildSnowflake);
      if (!user) {
        user = await DataBaseActions.User.new(snowflake, guildSnowflake);
      }

      let con = await pool.getConnection();
      await con.beginTransaction();

      // 2. Prepare metadata updates (Cake Day, Year, Username)
      const cakeday = userData.cakeday ?? user.cakeday;
      const cakeyear = userData.cakeyear ?? user.cakeyear;
      const username = userData.username ? cleanString(userData.username) : user.username;

      try {
        // 3. Execute the core user update
        const updateSql = `
        UPDATE users 
        SET username = ? 
        WHERE snowflake = ?`;
        await con.execute(updateSql, [username, snowflake]);


        //this will always create a user_guild entry if one doesn't exist, so we can safely update it without worrying about it not existing
        const userGuildUpdateSql = `
          UPDATE user_guild ug
          JOIN users u ON ug.user_id = u.id
          JOIN guild g ON ug.guild_id = g.id
          SET ug.cakeday = ?, ug.cakeyear = ?
          WHERE u.snowflake = ? AND g.snowflake = ?`;

        await con.execute(userGuildUpdateSql, [cakeday, cakeyear, snowflake, guildSnowflake]);

        // 4. Handle Role Synchronization if roles are provided
        if (userData.roles) {
          // Handle both legacy array format and the new normalized object format
          const roleList = Array.isArray(userData.roles)
            ? userData.roles
            : (userData.roles[guildSnowflake] || []);

          await privateDataBaseActions.User.syncRoles(user.id, guildSnowflake, roleList, con);
        }

        await con.commit();
        // Return the updated object
        return await DataBaseActions.User.get(snowflake, guildSnowflake);
      } catch (error) {
        await con.rollback();
        console.error(`Failed to update user ${snowflake}. Changes rolled back.`, error);
        throw error;
      } finally {
        con.release();
      }
    },

    /**
     * Synchronizes the many-to-many relationship for roles.
     * @param {number} internalUserId - The 'id' (double/auto_increment) from the users table.
     * @param {string} guildSnowflake - The Discord snowflake for the guild.
     * @param {string[]} roleSnowflakes - Array of role snowflakes the user should have.
     * @returns {Promise<void>} Resolves when the roles have been synchronized.
     */
    syncRoles: async (internalUserId, guildSnowflake, roleSnowflakes, connection = pool) => {
      try {
        // 1. Get internal Guild ID
        const [guildRows] = await connection.execute("SELECT id FROM guild WHERE snowflake = ?", [guildSnowflake]);
        if (guildRows.length === 0) throw new Error(`Guild ${guildSnowflake} not found.`);
        const internalGuildId = guildRows[0].id;

        // 2. Clear existing roles for this user in this specific guild
        // We join on guild_role to ensure we don't accidentally delete roles from other servers
        const deleteSql = `
        DELETE ugr FROM user_guild_role ugr
        INNER JOIN guild_role gr ON ugr.guild_role_id = gr.id
        WHERE ugr.user_id = ? AND gr.guild_id = ?`;

        await connection.execute(deleteSql, [internalUserId, internalGuildId]);

        // 3. Process new roles
        for (const rSnowflake of roleSnowflakes) {
          if (!assertIsSnowflake(rSnowflake)) continue;

          // Ensure the role exists in the guild_role table first
          // We use INSERT IGNORE so we don't crash if the role is already there
          await connection.execute(`
          INSERT INTO guild_role (guild_id, snowflake, friendly_name) 
          VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE snowflake = snowflake, friendly_name = VALUES(friendly_name)`,
            [internalGuildId, rSnowflake, `Role ${rSnowflake}`]
          );

          // Link the user to the role via the relational table
          await connection.execute(`
          INSERT INTO user_guild_role (user_id, guild_role_id)
          SELECT ?, id FROM guild_role WHERE snowflake = ? AND guild_id = ? ON DUPLICATE KEY UPDATE user_id = user_id`,
            [internalUserId, rSnowflake, internalGuildId]
          );
        }
      } catch (error) {
        throw error;
      }
    },

    get_by_internal_id: async (internalId) => {
      const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [internalId]);
      if (rows.length === 0) return null;
      return new DBUserObject(rows[0]);
    }
  },
  Guild: {
    /**
     * 
     * @param {Discord.snowflake} snowflakeResolvable 
     * @param {string} newName 
     * @returns {Promise<boolean>} Returns true if the update was successful
     */
    update_name: async (snowflakeResolvable, newName) => {
      const snowflake = parsesnowflake(snowflakeResolvable);
      await pool.execute('UPDATE guild SET friendly_name = ? WHERE snowflake = ?', [newName, snowflake]);
      return true;
    },

    get_by_internal_id: async (internalId) => {
      const [rows] = await pool.execute("SELECT * FROM guild WHERE id = ?", [internalId]);
      if (rows.length === 0) return null;
      return new DBGuildObject(rows[0]);
    }
  }
}

/**
 * An object representing the total amount of a specific currency a user has in the database
 * @member {Discord.Snowflake} snowflake the user or member id of the person to store
 * @member {DBCurrencyTotalObject[]} currencies an array of objects representing the total amount of each currency the user has in the database
 */
class DBUserCurrencyTotalObject {
  snowflake = "";
  currencies = [];
  /**
   * 
   * @param {Discord.Snowflake} snowflake 
   * @param {DBCurrencyTotalObject[]} currencies 
   */
  constructor(snowflake, currencies) {
    this.snowflake = snowflake;
    this.currencies = currencies;
  }
}

/**
 * An object representing a currency in the database, with its total amount for a user
 * @member {number} id the internal database ID of the currency
 * @member {string} name the name of the currency
 * @member {string} emoji the emoji representing the currency
 * @member {number} total the total amount of the currency the user has in the database
 */
class DBCurrencyTotalObject {
  /**
   * 
   * @param {number} id 
   * @param {string} name 
   * @param {string} emoji 
   * @param {number} total 
   */
  constructor(id, name, emoji, total) {
    this.id = id;
    this.name = name;
    this.emoji = emoji;
    this.total = total;
  }
}

/**
 * An object representing a currency in the database
 * @member {number} id the internal database ID of the currency
 * @member {string} name the name of the currency
 * @member {string} emoji the emoji representing the currency
 */
class DBCurrencyObject {
  /**
   * 
   * @param {number} id 
   * @param {string} name 
   * @param {string} emoji 
   */
  constructor(id, name, emoji) {
    this.id = id;
    this.name = name;
    this.emoji = emoji;
  }
}

//Cache for valid currencies that are in the database to avoid querying the database every time we need to determine the list of valid currencies. This is an object with the currency ID as the key and the value being a DBCurrencyObject representing that currency. 
//This cache is updated on bot restart
let ValidCurrenciesCache = [];

class LeaderboardEntryObject {
  constructor(snowflake, username, total, currencyName, currencyEmoji) {
    this.snowflake = snowflake;
    this.username = username;
    this.total = total;
    this.currencyName = currencyName;
    this.currencyEmoji = currencyEmoji;
  }
}


// Author objects and link
/**
 * CREATE TABLE `author` (
  `id` double NOT NULL AUTO_INCREMENT,
  `user_id` double NOT NULL,
  `name` varchar(256) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `blog_enabled` tinyint(1) DEFAULT NULL,
  `rss_url` varchar(256) DEFAULT NULL,
  `blog_post_webhook` varchar(256) DEFAULT NULL,
  `answer_channel_guild_id` double DEFAULT NULL,
  `answer_channel_snowflake` varchar(256) DEFAULT NULL,
  `answer_queue_notification_threshold` mediumint(8) unsigned DEFAULT NULL,
  `hex_color` varchar(9) DEFAULT '#1ed4c1',
  `image_url` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `author_user` (`user_id`),
  UNIQUE KEY `author_unique` (`name`),
  KEY `author_guild_FK` (`answer_channel_guild_id`),
  CONSTRAINT `author_guild_FK` FOREIGN KEY (`answer_channel_guild_id`) REFERENCES `guild` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `author_users_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='A table containing data on all the Authors for project Mizuchi'
 */

/**
 * CREATE TABLE `author_link` (
  `id` double NOT NULL AUTO_INCREMENT,
  `author_id` double NOT NULL,
  `name` varchar(100) NOT NULL,
  `url` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `author_link_author_id_IDX` (`author_id`) USING BTREE,
  CONSTRAINT `author_link_author_FK` FOREIGN KEY (`author_id`) REFERENCES `author` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Links to display for the author links commands'
 */

/**
 * An object representing an author in the database
 * @member {number} id the internal database ID of the author
 * @member {number} user_id the internal database ID of the user associated with this author
 * @member {DBUserObject} user the DBUserObject representing the user associated with this author, which we can use to get the user's information without having to query the database again, since we already have the user's ID stored in this.user_id, and we can use that to get the rest of the user's information from the database when we initialize this Author object, and then we can just reference this.user whenever we need to access the user's information for this author, which will be more efficient than querying the database for the user's information every time we need it.
 * @member {string} name the name of the author
 * @member {boolean} active whether this author is active or not. If an author is not active, then they won't be displayed in any commands or have any of their information displayed anywhere, and their blog won't be posted anywhere even if it's enabled. This is useful for authors who may want to take a break from posting or want to be temporarily removed from the bot for any reason without having to delete all of their information from the database and potentially lose it, since we can just set them to inactive and then set them back to active when they're ready to be displayed again.
 * @member {boolean} blog_available 
 * @member {string} rss_url the rss url of the author's blog, which will be used to fetch their blog posts and post them to the appropriate channels if their blog is enabled and they are active. This will only be displayed in commands and anywhere else if the blog is enabled, since it's only relevant if the blog is enabled.
 * @member {string} blog_post_webhook the webhook url to post the author's blog posts to when we fetch them from their rss feed, which will be used to post their blog posts to the appropriate channels if their blog is enabled and they are active. This will only be displayed in commands and anywhere else if the blog is enabled, since it's only relevant if the blog is enabled.
 * @member {number} answer_channel_guild_id the internal database ID of the guild that the author's answer channel is in, which will be used to get the snowflake of that guild and then get the channel object for that channel when we need to post answers to that channel or display information about that channel. This will only be displayed in commands and anywhere else if the author is active, since it's only relevant if the author is active.
 * @member {DBGuildObject} answer_channel_guild the DBGuildObject representing the guild that the author's answer channel is in, which will be used to get the snowflake of that guild and then get the channel object for that channel when we need to post answers to that channel or display information about that channel. This will only be displayed in commands and anywhere else if the author is active, since it's only relevant if the author is active.
 * @member {string} answer_channel_snowflake the snowflake of the channel that the author's answer channel is in, which will be used to post answers to that channel or display information about that channel when we need to. This will only be displayed in commands and anywhere else if the author is active and the answer channel guild is set, since it's only relevant if the author is active and the answer channel guild is set.
 * @member {number} answer_queue_notification_threshold the threshold for how many answers can be in the queue before we start notifying about it in the answer channel, which will be used to determine when to start posting notifications about how many answers are in the queue in the answer channel. This will only be displayed in commands and anywhere else if the author is active, since it's only relevant if the author is active.
 * @member {string} hex_color the hex color to use for this author when displaying their information in commands or anywhere else, which will be used to make their information look nicer and more personalized when we display it. This will only be displayed in commands and anywhere else if the author is active, since it's only relevant if the author is active.
 * @member {string} image_url the url of the image to use for this author when displaying their information in commands or anywhere else, which will be used to make their information look nicer and more personalized when we display it. This will only be displayed in commands and anywhere else if the author is active, since it's only relevant if the author is active.
 * @member {AuthorLink[]} links an array of AuthorLink objects representing the links associated with this author, which can be used for the author links command. This will only be displayed in commands and anywhere else if the author is active, since it's only relevant if the author is active.
 */
class Author {
  #id = null;
  #user_id = null;
  #user = null; // this will be a DBUserObject representing the user associated with this author, which we can use to get the user's information without having to query the database again, since we already have the user's ID stored in this.#user_id, and we can use that to get the rest of the user's information from the database when we initialize this Author object, and then we can just reference this.#user whenever we need to access the user's information for this author, which will be more efficient than querying the database for the user's information every time we need it.
  #name = "";
  #active = true;
  #blog_enabled = false;
  #rss_url = null;
  #blog_post_webhook = null;
  #answer_channel_guild_id = null;
  #answer_channel_guild = null; // this will be a DBGuildObject representing the guild that the author's answer channel is in, which we can use to get the snowflake of that guild and then get the channel object for that channel when we need to post answers to that channel or display information about that channel. This will only be set if the author is active, since it's only relevant if the author is active.  
  #answer_channel_snowflake = null;
  #answer_queue_notification_threshold = null;
  #hex_color = "#1ed4c1";
  #image_url = null;
  #links = []; //this will be an array of AuthorLinks representing the links associated with this.#author, which can be used for the author links command

  constructor(id, user_resolvable, name, active, blog_enabled, rss_url, blog_post_webhook, answer_channel_guild_resolvable, answer_channel_snowflake, answer_queue_notification_threshold, hex_color, image_url) {
    this.#id = id;
    if (user_resolvable instanceof DBUserObject) {
      this.#user_id = user_resolvable.id;
    }
    else {
      this.#user_id = user_resolvable;
    }
    this.#name = name;
    this.#active = active;
    this.#blog_enabled = blog_enabled;
    this.#rss_url = rss_url;
    this.#blog_post_webhook = blog_post_webhook;
    if (answer_channel_guild_resolvable instanceof DBGuildObject) {
      this.#answer_channel_guild_id = answer_channel_guild_resolvable.id;
    }
    else {
      this.#answer_channel_guild_id = answer_channel_guild_resolvable;
    }
    this.#answer_channel_snowflake = answer_channel_snowflake;
    this.#answer_queue_notification_threshold = answer_queue_notification_threshold;
    this.#hex_color = hex_color;
    this.#image_url = image_url;
  }

  // Getters and setters, but for this.#object we will actually pull from the database and set to the database
  get id() {
    return this.#id;
  }
  get user() {
    if (!this.#user) {
      throw new Error("User not loaded for this author. Please call the get() method to load the user from the database before accessing this property.");
    }
    return this.#user;
  }
  get name() {
    return this.#name;
  }
  get active() {
    return this.#active;
  }
  get blog_available() {
    return this.#active && this.#blog_enabled && this.#rss_url && this.#blog_post_webhook; // the blog is only truly available if the author is active and the blog is enabled and the rss url and blog post webhook are set, since those are both required for the blog to function, so we can use this.getter to check if the blog is available instead of having to check all of those things separately every time we want to check if the blog is available.
  }
  get rss_url() {
    if (!this.#active || !this.#blog_enabled) return null; // if the author isn't active or the blog isn't enabled, then there shouldn't be an rss url. this.#is just a safety check to avoid having to check for active and blog_enabled every time we check for rss_url, since rss_url is only relevant if the author is active and the blog is enabled.
    return this.#rss_url;
  }
  get blog_post_webhook() {
    if (!this.#active || !this.#blog_enabled) return null; // if the author isn't active or the blog isn't enabled, then there shouldn't be a blog post webhook. this.#is just a safety check to avoid having to check for active and blog_enabled every time we check for blog_post_webhook, since blog_post_webhook is only relevant if the author is active and the blog is enabled.
    return this.#blog_post_webhook;
  }
  get answer_channel_guild() {
    if (!this.#active) return null; // if the author isn't active, then there shouldn't be an answer channel guild. this.#is just a safety check to avoid having to check for active every time we check for answer_channel_guild, since answer_channel_guild is only relevant if the author is active.
    if (!this.#answer_channel_guild) {
      throw new Error("Answer channel guild not loaded for this author. Please call the get() method to load the answer channel guild from the database before accessing this property.");
    }
    return this.#answer_channel_guild;
  }
  get answer_channel_snowflake() {
    if (!this.#active || !this.#answer_channel_guild) return null; // if the author isn't active or the answer channel guild isn't set, then there shouldn't be an answer channel snowflake. this.#is just a safety check to avoid having to check for active and answer_channel_guild every time we check for answer_channel_snowflake, since answer_channel_snowflake is only relevant if the author is active and the answer channel guild is set.
    return this.#answer_channel_snowflake;
  }
  get answer_queue_notification_threshold() {
    if (!this.#active || !this.#answer_channel_guild || !this.#answer_channel_snowflake) return 0; // if the author isn't active or the answer channel guild isn't set or the answer channel snowflake isn't set, then there shouldn't be an answer queue notification threshold. this.#is just a safety check to avoid having to check for active and answer_channel_guild and answer_channel_snowflake every time we check for answer_queue_notification_threshold, since answer_queue_notification_threshold is only relevant if the author is active and the answer channel guild and snowflake are set.
    return this.#answer_queue_notification_threshold;
  }
  get hex_color() {
    if (!this.#active) return "#dfdfdf";
    return this.#hex_color;
  }
  get image_url() {
    return this.#image_url;
  }
  get links() {
    return this.#links;
  }

  async create() {
    // this.#ill create a new author in the database, and set the ID of this.#object to the new ID from the database. 
    // It will throw an error if the user associated with this.#author already has an author, 
    // or if the name of this.#author is already taken, 
    // as those are both unique fields in the database. 
    const result = await pool.execute(`
      INSERT INTO author (user_id, name, active, blog_enabled, rss_url, blog_post_webhook, answer_channel_guild_id, answer_channel_snowflake, answer_queue_notification_threshold, hex_color, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [this.#user.id, this.#name, this.#active ? 1 : 0, this.#blog_enabled ? 1 : 0, this.#rss_url, this.#blog_post_webhook, this.#answer_channel_guild ? this.#answer_channel_guild.id : null, this.#answer_channel_snowflake, this.#answer_queue_notification_threshold, this.#hex_color, this.#image_url]
    );
    this.#id = result[0].insertId;
    return this;
  }

  static async get(author_id_or_user_resolvable) {
    // this will get an author from the database based on the provided author ID or user resolvable,
    // and return a new Author representing that author. It will throw an error if the author is not found in the database.
    let author_id;
    if (typeof author_id_or_user_resolvable === "number") {
      author_id = author_id_or_user_resolvable;
    } else if (author_id_or_user_resolvable instanceof DBUserObject) {
      const [rows] = await pool.execute("SELECT * FROM author WHERE user_id = ?", [author_id_or_user_resolvable.id]);
      if (rows.length === 0) throw new Error(`Author with user ID ${author_id_or_user_resolvable.id} not found in the database.`);
      author_id = rows[0].id;
    } else {
      const user_snowflake = parsesnowflake(author_id_or_user_resolvable);
      const [rows] = await pool.execute("SELECT author.* FROM author LEFT JOIN users ON author.user_id = users.id WHERE users.snowflake = ?", [user_snowflake]);
      if (rows.length === 0) throw new Error(`Author with user snowflake ${user_snowflake} not found in the database.`);
      author_id = rows[0].id;
    }

    const author = new Author(author_id);
    await author.get(); // populate the rest of the data from the database
    return author;
  }

  static async getAll() {
    // this will get all authors from the database, and return an array of Authors representing those authors.
    const [rows] = await pool.execute("SELECT * FROM author");
    const authors = [];
    for (const row of rows) {
      const author = new Author(row.id);
      await author.get(); // populate the rest of the data from the database for each author
      authors.push(author);
    }
    return authors;
  }

  async get() {
    // this will get the latest data for this.#author from the database, and update this.#object with that data. It will throw an error if the author is not found in the database.
    if (!this.#id) throw new Error("Author must have an ID to be retrieved from the database.");
    const [rows] = await pool.execute("SELECT * FROM author WHERE id = ?", [this.#id]);
    if (rows.length === 0) throw new Error(`Author with ID ${this.#id} not found in the database.`);
    const data = rows[0];
    this.#name = data.name;
    this.#active = !!data.active;
    this.#blog_enabled = !!data.blog_enabled;
    this.#rss_url = data.rss_url;
    this.#blog_post_webhook = data.blog_post_webhook;
    this.#answer_channel_snowflake = data.answer_channel_snowflake;
    this.#answer_queue_notification_threshold = data.answer_queue_notification_threshold;
    this.#hex_color = data.hex_color;
    this.#image_url = data.image_url;
    if (data.user_id) {
      this.#user = await privateDataBaseActions.User.get_by_internal_id(data.user_id);
      this.#user_id = data.user_id;
    } else {
      this.#user = null;
      this.#user_id = null;
    }
    if (data.answer_channel_guild_id) {
      this.#answer_channel_guild = await privateDataBaseActions.Guild.get_by_internal_id(data.answer_channel_guild_id);
    } else {
      this.#answer_channel_guild = null;
    }
    // get all the links for this author from the database and set this.#links to an array of AuthorLinks representing those links
    const [linkRows] = await pool.execute("SELECT * FROM author_link WHERE author_id = ?", [this.#id]);
    this.#links = linkRows.map(linkData => new AuthorLink(linkData.id, this.#id, linkData.name, linkData.url));


    return this;
  }

  async setName(name) {
    // this.#will set the name of this.#author in the database, and update this.#object with the new name. It will throw an error if the name is already taken by another author, as the name field is unique in the database, or if the author is not found in the database.
    if (!this.#id) throw new Error("Author must have an ID to be updated in the database.");
    await pool.execute("UPDATE author SET name = ? WHERE id = ?", [name, this.#id]);
    this.#name = name;
    return this;
  }

  async setActive(active) {
    // this.#will set the active status of this.#author in the database, and update this.#object with the new status. If the author is being deactivated, it will also disable their blog and clear their answer channel info, as those are only relevant for active authors. It will throw an error if the author is not found in the database.
    if (!this.#id) throw new Error("Author must have an ID to be updated in the database.");
    await pool.execute("UPDATE author SET active = ? WHERE id = ?", [active ? 1 : 0, this.#id]);
    this.#active = active;
    if (!active) {
      this.#blog_enabled = false;
      this.#rss_url = null;
      this.#blog_post_webhook = null;
      this.#answer_channel_snowflake = null;
      this.#answer_queue_notification_threshold = 0;
    } else {
      await this.get(); // Refresh data from DB to ensure consistency, especially if reactivating an author
    }
    return this;
  }

  async setBlogEnabled(blog_enabled) {
    if (!this.#id) throw new Error("Author must have an ID to be updated in the database.");
    if (blog_enabled && !this.#active) {
      throw new Error("Cannot enable blog for an inactive author. Please activate the author before enabling the blog.");
    }
    await pool.execute("UPDATE author SET blog_enabled = ? WHERE id = ?", [blog_enabled ? 1 : 0, this.#id]);
    this.#blog_enabled = blog_enabled;
    if (!blog_enabled) {
      this.#rss_url = null;
      this.#blog_post_webhook = null;
    } else {
      await this.get(); // Refresh data from DB to ensure consistency, especially if enabling the blog which may have specific settings
    }
    return this;
  }

  async setRssUrl(rss_url) {
    if (!this.#id) throw new Error("Author must have an ID to be updated in the database.");
    if (!this.#active || !this.#blog_enabled) {
      throw new Error("Cannot set RSS URL for an author whose blog is not enabled or who is inactive. Please ensure the author is active and the blog is enabled before setting the RSS URL.");
    }
    await pool.execute("UPDATE author SET rss_url = ? WHERE id = ?", [rss_url, this.#id]);
    this.#rss_url = rss_url;
    return this;
  }

  async setBlogPostWebhook(blog_post_webhook) {
    if (!this.#id) throw new Error("Author must have an ID to be updated in the database.");
    if (!this.#active || !this.#blog_enabled) {
      throw new Error("Cannot set blog post webhook for an author whose blog is not enabled or who is inactive. Please ensure the author is active and the blog is enabled before setting the blog post webhook.");
    }
    await pool.execute("UPDATE author SET blog_post_webhook = ? WHERE id = ?", [blog_post_webhook, this.#id]);
    this.#blog_post_webhook = blog_post_webhook;
    return this;
  }

  async setAnswerChannel(guildResolvable, channelSnowflake) {
    if (!this.#id) throw new Error("Author must have an ID to be updated in the database.");
    if (!this.#active) {
      throw new Error("Cannot set answer channel for an inactive author. Please activate the author before setting the answer channel.");
    }
    const guildSnowflake = parsesnowflake(guildResolvable);
    await pool.execute("UPDATE author SET answer_channel_guild_id = ?, answer_channel_snowflake = ? WHERE id = ?", [guildSnowflake, channelSnowflake, this.#id]);
    this.#answer_channel_guild = await privateDataBaseActions.Guild.get_by_internal_id(guildSnowflake);
    this.#answer_channel_snowflake = channelSnowflake;
    return this;
  }

  async setAnswerQueueNotificationThreshold(threshold) {
    if (!this.#id) throw new Error("Author must have an ID to be updated in the database.");
    if (!this.#active || !this.#answer_channel_guild || !this.#answer_channel_snowflake) {
      throw new Error("Cannot set answer queue notification threshold for an author who is inactive or does not have an answer channel set. Please ensure the author is active and has an answer channel set before setting the notification threshold.");
    }
    await pool.execute("UPDATE author SET answer_queue_notification_threshold = ? WHERE id = ?", [threshold, this.#id]);
    this.#answer_queue_notification_threshold = threshold;
    return this;
  }

  async setHexColor(hex_color) {
    if (!this.#id) throw new Error("Author must have an ID to be updated in the database.");
    if (!this.#active) {
      throw new Error("Cannot set hex color for an inactive author. Please activate the author before setting the hex color.");
    }
    await pool.execute("UPDATE author SET hex_color = ? WHERE id = ?", [hex_color, this.#id]);
    this.#hex_color = hex_color;
    return this;
  }

  async setImageUrl(image_url) {
    if (!this.#id) throw new Error("Author must have an ID to be updated in the database.");
    if (!this.#active) {
      throw new Error("Cannot set image URL for an inactive author. Please activate the author before setting the image URL.");
    }
    await pool.execute("UPDATE author SET image_url = ? WHERE id = ?", [image_url, this.#id]);
    this.#image_url = image_url;
    return this;
  }

  async addLink(name, url) {
    if (!this.#id) throw new Error("Author must have an ID to add a link to the database.");
    const link = new AuthorLink(null, this.#id, name, url);
    await link.create();
    this.#links.push(link);
    return link;
  }

}

class AuthorLink {
  #id = null
  #author_id = null;
  #name = "";
  #url = "";

  constructor(id, author_id, name, url) {
    this.#id = id;
    this.#author_id = author_id;
    this.#name = name;
    this.#url = url;
  }

  get id() {
    return this.#id;
  }

  get author_id() {
    return this.#author_id;
  }

  get name() {
    return this.#name;
  }

  get url() {
    return this.#url;
  }


  async delete() {
    if (!this.#id) throw new Error("Author link must have an ID to be deleted from the database.");
    await pool.execute("DELETE FROM author_link WHERE id = ?", [this.#id]);
    this.#id = null;
    return true;
  }

  async create() {
    if (!this.#author_id) throw new Error("Author link must have an author ID to be created in the database.");
    const result = await pool.execute("INSERT INTO author_link (author_id, name, url) VALUES (?, ?, ?)", [this.#author_id, this.#name, this.#url]);
    this.#id = result[0].insertId;
    return this;
  }

}

const DataBaseActions = {
  // classes, for easier use in other files
  DBCurrencyObject,
  DBCurrencyTotalObject,
  DBUserCurrencyTotalObject,
  DBUserObject,
  LeaderboardEntryObject,
  DBGuildObject,
  DBGuildRoleObject,
  Author,
  User: {
    /** gets all the info a database has about a user, and returns it as a DBUserObject
     * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} snowflakeResolvable
     * @returns {Promise<DBUserObject|null>}
     */
    get: async (snowflakeResolvable, guild_snowflake) => {
      const snowflake = await parsesnowflake(snowflakeResolvable);
      const userSql = `
        SELECT users.id as id, users.snowflake as snowflake, users.username as username, 
               user_guild.cakeday as cakeday, user_guild.cakeyear as cakeyear 
        FROM users 
        LEFT JOIN user_guild ON users.id = user_guild.user_id 
        LEFT JOIN guild ON user_guild.guild_id = guild.id 
        WHERE users.snowflake = ? AND guild.snowflake = ?`;

      const [userRows] = await pool.execute(userSql, [snowflake, guild_snowflake]);

      if (!userRows || userRows.length === 0) return null;
      let user = userRows[0];
      const roleSql = `
        SELECT guild_role.snowflake as snowflake 
        FROM user_guild_role 
        LEFT JOIN users on user_guild_role.user_id = users.id 
        LEFT JOIN guild_role on user_guild_role.guild_role_id = guild_role.id 
        LEFT JOIN guild on guild_role.guild_id = guild.id 
        WHERE users.snowflake = ? AND guild.snowflake = ?`;

      const [roleRows] = await pool.execute(roleSql, [snowflake, guild_snowflake]);

      user.roles = roleRows.map(role => new DBGuildRoleObject(role).snowflake);
      user.roles = normalizeRolesByGuild(user.roles);

      return new DBUserObject(user);
    },
    /**
     * gets the currency information for a user from the database
     * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} snowflakeResolvable 
     * @returns {DBUserCurrencyTotalObject} the database user currency object for the user, if it exists 
     */
    getBalance: async (snowflakeResolvable) => {
      const snowflake = await parsesnowflake(snowflakeResolvable);

      const query = `
        SELECT currency.name as name, currency.emoji as emoji, currency.id as id, SUM(amount) as total 
        FROM users 
        LEFT JOIN transaction ON users.snowflake = transaction.userid 
        LEFT JOIN currency ON currency.id = transaction.currencyid 
        WHERE users.snowflake = ? AND currency.active 
        GROUP BY currency.id 
        ORDER BY currency.id`;

      const [rows] = await pool.execute(query, [snowflake]);

      if (!rows || rows.length === 0) {
        throw new Error(`No transactions for snowflake ${snowflake} were found.`);
      }

      const userCurrencyArray = rows.map(row =>
        new DBCurrencyTotalObject(row.id, row.name, row.emoji, row.total)
      );

      return new DBUserCurrencyTotalObject(snowflake, userCurrencyArray);
    },

    /** gets all the info a database has about all users, and returns it as a DataBaseUser object array
     * @returns {DBUserObject[]} the database user objects if they exist
    */
    getAll: async (guild_snowflake) => {
      const query = `
        SELECT users.snowflake 
        FROM users 
        LEFT JOIN user_guild ON users.id = user_guild.user_id 
        LEFT JOIN guild ON user_guild.guild_id = guild.id 
        WHERE guild.snowflake = ?`;

      const [rows] = await pool.execute(query, [guild_snowflake]);

      // Fetch full user objects concurrently
      const promises = rows.map(row => DataBaseActions.User.get(row.snowflake, guild_snowflake));
      return await Promise.all(promises);
    },
    /** gets all the info a database has about all users who have at least one non-managed role, and returns it as a DataBaseUser object array
     * @returns {DBUserObject[]} the database user objects if they exist
    */
    getMost: async (guild_snowflake) => {
      const query = `
        SELECT users.snowflake 
        FROM users 
        INNER JOIN user_guild ON users.id = user_guild.user_id 
        INNER JOIN guild ON user_guild.guild_id = guild.id 
        LEFT JOIN user_guild_role ON user_guild_role.user_id = users.id 
        LEFT JOIN guild_role ON user_guild_role.guild_role_id = guild_role.id AND guild_role.guild_id = guild.id
        WHERE guild.snowflake = ? 
        GROUP BY users.snowflake 
        HAVING COUNT(guild_role.id) > 1`;

      const [rows] = await pool.execute(query, [guild_snowflake]);

      const promises = rows.map(row => DataBaseActions.User.get(row.snowflake, guild_snowflake));
      return await Promise.all(promises);
    },
    /**
     * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake|DBUserObject.snowflake|DBUserObject)} snowflake - The ID of the user to find, or an object that has an ID;
     */
    new: async (snowflakeResolvable, guildsnowflake) => {
      const snowflake = parsesnowflake(snowflakeResolvable);

      // 1. Double check existence to prevent Duplicate Entry errors
      const exists = await DataBaseActions.User.get(snowflake, guildsnowflake);
      if (exists != null) return exists;

      try {
        // 2. Resolve Username Failover
        // Check primary server first
        const primaryGuild = client.guilds.cache.get(client.config.snowflakes.guilds.PrimaryServer);
        const primaryMember = primaryGuild?.members.cache.get(snowflake);
        let username = primaryMember ? cleanString(primaryMember.displayName) : null;

        const allGuilds = await client.guilds.fetch();
        const cakeday = "opt-out";
        const cakeyear = new Date().getFullYear().toString();
        const discoveredGuilds = [];

        // Search all guilds for a username and collect role data
        await Promise.all(allGuilds.map(async (partialGuild) => {
          try {
            const guild = await partialGuild.fetch();

            // 1. Try checking the cache FIRST (Zero API hits, instant)
            let member = guild.members.cache.get(snowflake);

            // 2. Only if they aren't in cache, fetch them (safely catching errors)
            if (!member) {
              member = await guild.members.fetch(snowflake).catch(() => null);
            }

            if (member) {
              if (!username) username = cleanString(member.displayName);

              // Store the roles per guild to pass to the update function later
              discoveredGuilds.push({
                guildId: guild.id,
                roles: member.roles.cache.filter(r => !r.managed).map(r => r.id)
              });
            }
          } catch (err) { /* User not in this guild */ }
        }));

        // Final fallback for usernames
        if (!username) username = "Unknown User";

        // 3. The seed Insert
        // We create the user record FIRST so privateDataBaseActions.User.update finds them
        const sql = `
          INSERT INTO \`users\` (\`snowflake\`, \`username\`) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE snowflake = values(snowflake), username = values(username)`;

        await pool.execute(sql, [snowflake, username]);

        const [guildRows] = await pool.execute(
          "SELECT id FROM guild WHERE snowflake = ?",
          [guildsnowflake] // The Discord ID
        );
        if (guildRows.length === 0) throw new Error(`Guild ${guildsnowflake} not found in DB!`);
        const internalGuildId = guildRows[0].id;

        // 2. Translate the Discord User Snowflake into the Internal User ID
        const [userRows] = await pool.execute(
          "SELECT id FROM users WHERE snowflake = ?",
          [snowflake] // The Discord ID
        );
        if (userRows.length === 0) throw new Error(`User ${snowflake} not found in DB!`);
        const internalUserId = userRows[0].id;

        // 3. NOW it is safe to insert into user_guild using the internal IDs!
        await pool.execute(`
                INSERT INTO user_guild (user_id, guild_id) 
                VALUES (?, ?) 
                ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), guild_id = VALUES(guild_id)
            `
          , [internalUserId, internalGuildId]);

        // 4. Role and Table Synchronization
        for (const data of discoveredGuilds) {
          await privateDataBaseActions.User.update({
            snowflake: snowflake,
            cakeday: cakeday,
            cakeyear: cakeyear,
            roles: { [data.guildId]: data.roles }
          }, data.guildId);
        }

        // 5. Final Return
        return await DataBaseActions.User.get(snowflake, guildsnowflake);

      } catch (criticalError) {
        console.error("Critical error creating new user:", criticalError);
        throw criticalError;
      }
    },

    updateCakeDay: async (snowflakeResolvable, cakeday, guildsnowflake) => {
      if (!assertIsCakeDay(cakeday)) throw new Error("Invalid Cake Day format");
      const snowflake = parsesnowflake(snowflakeResolvable);
      return await privateDataBaseActions.User.update({ snowflake, cakeday }, guildsnowflake);
    },

    /**
     * Checks if a user possesses any roles in a specific guild flagged with sensitive data.
     * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} snowflakeResolvable 
     * @param {string} guild_snowflake 
     * @returns {Promise<boolean>} True if the user has redacted info roles, otherwise false.
     */
    hasSensitiveRoles: async (snowflakeResolvable, guild_snowflake) => {
      const snowflake = await parsesnowflake(snowflakeResolvable);

      // We use SELECT 1 and LIMIT 1 for maximum performance. 
      // It stops searching the millisecond it finds a single match.
      const sql = `
        SELECT 1 
        FROM user_guild_role ugr
        INNER JOIN users u ON ugr.user_id = u.id
        INNER JOIN guild_role gr ON ugr.guild_role_id = gr.id
        INNER JOIN guild g ON gr.guild_id = g.id
        WHERE u.snowflake = ? 
          AND g.snowflake = ? 
          AND gr.has_redacted_info = 1 
        LIMIT 1`;

      const [rows] = await pool.execute(sql, [snowflake, guild_snowflake]);

      // If the array has anything in it, they have a sensitive role!
      return rows.length > 0;
    },
    /**
     * Strictly syncs a user's roles to the database without touching profile data.
     * @param {Discord.GuildMember} member 
     */
    sync_roles: async (member) => {
      if (!member || !member.id || !member.guild) {
        throw new Error("A valid Discord GuildMember object is required.");
      }

      const guildSnowflake = member.guild.id;
      const userSnowflake = member.id;
      const roleSnowflakes = member.roles.cache.filter(r => !r.managed).map(r => r.id);

      // 1. Fetch/Upsert the User. 
      // This returns a full DBUserObject
      const dbUser = await privateDataBaseActions.User.update({
        snowflake: userSnowflake,
      }, guildSnowflake);

      // 2. Pass ONLY the internal integer ID (.id) to the private role sync engine
      await privateDataBaseActions.User.syncRoles(dbUser.id, guildSnowflake, roleSnowflakes);
      return true;
    },
  },
  Guild: {
    /*
    +---------------+--------------+------+-----+---------+----------------+
    | Field         | Type         | Null | Key | Default | Extra          |
    +---------------+--------------+------+-----+---------+----------------+
    | id            | double       | NO   | PRI | NULL    | auto_increment |
    | snowflake     | varchar(100) | NO   | UNI | NULL    |                |
    | isTestGuild   | tinyint(1)   | NO   |     | 0       |                |
    | friendly_name | varchar(100) | NO   | UNI | NULL    |                |
    +---------------+--------------+------+-----+---------+----------------+
    */
    get: async (snowflakeResolvable) => {
      const snowflake = await parsesnowflake(snowflakeResolvable);

      const [guildRows] = await pool.execute("SELECT * FROM guild WHERE snowflake = ?", [snowflake]);

      if (!guildRows || guildRows.length === 0) {
        // We need to create a new guild object in the database
        try {
          const discordGuild = await client.guilds.fetch(snowflake);
          const newGuild = await DataBaseActions.Guild.new(
            new DBGuildObject({ snowflake: snowflake, friendly_name: discordGuild.name, isTestGuild: false })
          );
          return newGuild;
        } catch (error) {
          throw new Error(`No guild with ID ${snowflake} was found in Discord or DB. Error: ${error}`);
        }
      }

      let guild = guildRows[0];

      // Get the roles
      const roleSql = `
        SELECT guild_role.* 
        FROM guild_role 
        LEFT JOIN guild on guild_role.guild_id = guild.id 
        WHERE guild.snowflake = ?`;

      const [roleRows] = await pool.execute(roleSql, [snowflake]);
      guild.roles = roleRows.map(role => new DBGuildRoleObject(role));

      return new DBGuildObject(guild);
    },

    /**
      * Gets all guilds in the database with their associated roles.
      * @returns {Promise<DBGuildObject[]>} An array of guild objects with their roles.
      */
    getAll: async () => {
      const [guildRows] = await pool.execute("SELECT * FROM guild");

      // Use Promise.all to fetch roles for all guilds concurrently
      const promises = guildRows.map(async (guild) => {
        const roleSql = `
          SELECT guild_role.* 
          FROM guild_role 
          LEFT JOIN guild on guild_role.guild_id = guild.id 
          WHERE guild.snowflake = ?`;

        const [roleRows] = await pool.execute(roleSql, [guild.snowflake]);

        guild.roles = roleRows.map(role => new DBGuildRoleObject(role));
        return new DBGuildObject(guild);
      });

      return await Promise.all(promises);
    },

    /**
     * Creates a new guild in the database if it doesn't already exist.
     * @param {DBGuildObject} dbGuildObject the basic construction object for the guild
     */
    new: async (dbGuildObject) => {
      if (!dbGuildObject || !dbGuildObject.snowflake || !dbGuildObject.friendly_name || typeof dbGuildObject.isTestGuild !== 'boolean') {
        throw new Error("Invalid dbGuildObject");
      }

      const snowflake = await parsesnowflake(dbGuildObject.snowflake);

      const exists = await DataBaseActions.Guild.get(snowflake);
      if (exists != null) return exists;

      // Insert Guild
      const sql = "INSERT INTO `guild` (`snowflake`, `friendly_name`, `isTestGuild`) VALUES (?, ?, ?)";
      await pool.execute(sql, [snowflake, dbGuildObject.friendly_name ?? '', dbGuildObject.isTestGuild ? 1 : 0]);

      // Add roles if they exist
      if (dbGuildObject.roles && Array.isArray(dbGuildObject.roles)) {
        const roleSql = `
          INSERT INTO \`guild_role\` (\`guild_id\`, \`snowflake\`, \`friendly_name\`, \`has_redacted_info\`, \`is_update_role\`) 
          VALUES ((SELECT id FROM guild WHERE snowflake = ?), ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          friendly_name = VALUES(friendly_name),
          has_redacted_info = VALUES(has_redacted_info),
          is_update_role = VALUES(is_update_role)`;

        // Sequential insert to avoid flooding the connection pool
        for (const role of dbGuildObject.roles) {
          try {
            await pool.execute(roleSql, [
              snowflake,
              role.snowflake,
              role.friendly_name ?? '',
              role.has_redacted_info ? 1 : 0,
              role.is_update_role ? 1 : 0
            ]);
          } catch (error) {
            console.error(`Error adding role ${role.friendly_name} to guild ${dbGuildObject.friendly_name}:`, error);
          }
        }
      }

      return { snowflake, friendly_name: dbGuildObject.friendly_name ?? '', isTestGuild: dbGuildObject.isTestGuild ? 1 : 0 };
    },

    update_isTestGuild: async (snowflakeResolvable, isTestGuild) => {
      const snowflake = parsesnowflake(snowflakeResolvable);
      const [result] = await pool.execute("UPDATE guild SET isTestGuild = ? WHERE snowflake = ?", [isTestGuild, snowflake]);
      return result;
    },

    update_friendly_name: async (snowflakeResolvable, newFriendlyName) => {
      const snowflake = parsesnowflake(snowflakeResolvable);
      const [result] = await pool.execute("UPDATE guild SET friendly_name = ? WHERE snowflake = ?", [newFriendlyName, snowflake]);
      return result;
    },

    update_roles: async (snowflakeResolvable, roles) => {
      const snowflake = parsesnowflake(snowflakeResolvable);

      const guild = await DataBaseActions.Guild.get(snowflake);
      if (!guild) throw new Error("Guild not found");

      // Get internal database ID for the guild
      const [guildIdResult] = await pool.execute("SELECT id FROM guild WHERE snowflake = ?", [snowflake]);
      if (guildIdResult.length === 0) throw new Error("Guild ID could not be resolved in the database.");

      const internalGuildId = guildIdResult[0].id;

      // Process roles
      for (const role of roles) {
        const existingRole = guild.roles.find(r => r.snowflake === role.snowflake);

        if (existingRole) {
          // Check if properties have changed
          if (existingRole.friendly_name !== role.friendly_name ||
            existingRole.has_redacted_info !== role.has_redacted_info ||
            existingRole.is_update_role !== role.is_update_role) {

            const updateSql = `
              UPDATE guild_role 
              SET friendly_name = ?, has_redacted_info = ?, is_update_role = ? 
              WHERE snowflake = ? AND guild_id = ?`;

            try {
              await pool.execute(updateSql, [
                role.friendly_name,
                role.has_redacted_info,
                role.is_update_role,
                role.snowflake,
                internalGuildId
              ]);
            } catch (error) {
              console.error(`Error updating role ${role.friendly_name} in guild ${guild.friendly_name}:`, error);
            }
          }
        } else {
          // Add the new role
          const insertSql = `
            INSERT INTO \`guild_role\` (\`guild_id\`, \`snowflake\`, \`friendly_name\`, \`has_redacted_info\`, \`is_update_role\`) 
            VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
            friendly_name = VALUES(friendly_name),
            has_redacted_info = VALUES(has_redacted_info),
            is_update_role = VALUES(is_update_role)`;

          try {
            await pool.execute(insertSql, [
              internalGuildId,
              role.snowflake,
              role.friendly_name,
              role.has_redacted_info,
              role.is_update_role
            ]);
          } catch (error) {
            console.error(`Error adding role ${role.friendly_name} to guild ${guild.friendly_name}:`, error);
          }
        }
      }
      return true;
    }
  },
  Economy: {
    /** gets all the valid currencies from the cache
      * @returns {DBCurrencyObject[]} the valid currency objects if they exist
    */
    getValidCurrencies: async () => {
      if (ValidCurrenciesCache.length === 0) {
        try {
          const [rows] = await pool.execute("SELECT * FROM currency WHERE active = 1");

          ValidCurrenciesCache = rows.map(currency =>
            new DBCurrencyObject(currency.id, currency.name, currency.emoji)
          );

          console.log(`Currency cache loaded with ${ValidCurrenciesCache.length} currencies.`);
        } catch (error) {
          console.error("Error loading currency cache:", error);
          throw error;
        }
      }
      return ValidCurrenciesCache;
    },
    /**
     * Creates a new transaction in the database
     * @param {Discord.User|Discord.GuildMember|Discord.Snowflake|DBUserObject.snowflake|DBUserObject} snowflakeResolvable 
     * @param {number} currencyId 
     * @param {number} amount 
     * @param {Discord.User|Discord.GuildMember|Discord.Snowflake|DBUserObject.snowflake|DBUserObject} initiatedBysnowflakeResolvable 
     * @param {string} reason the reason for the transaction, could also be considered the category. E.g. "gift", "purchase", "prize", etc. Should be a simple string that can be used to easily identify the transaction in the future, and group it with similar transactions.
     * @returns 
     */
    newTransaction: async (snowflakeResolvable, currencyId, amount, initiatedBysnowflakeResolvable, reason) => {
      const snowflake = await parsesnowflake(snowflakeResolvable);
      const initatedbysnowflake = await parsesnowflake(initiatedBysnowflakeResolvable);

      const currency = ValidCurrenciesCache.find(c => c.id == currencyId);
      if (!currency) throw new Error("Invalid currency ID");

      const sql = `
        INSERT INTO \`transaction\` (\`userid\`, \`currencyID\`, \`amount\`, \`initatedbyuserid\`, \`reason\`)
        VALUES (?, ?, ?, ?, ?)`;

      console.log(`Creating transaction: User ${snowflake}, Currency ID ${currencyId}, Amount ${amount}, Initiated By ${initatedbysnowflake}, Reason: ${reason}`);

      const [result] = await pool.execute(sql, [
        snowflake,
        currencyId,
        amount,
        initatedbysnowflake,
        reason
      ]);

      return result;
    },
    /**
     * Gets the transaction history for a specific user
     */
    getTransactionHistory: async (snowflakeResolvable) => {
      const snowflake = await parsesnowflake(snowflakeResolvable);
      const sql = `
        SELECT transaction.*, currency.name as currencyName, currency.emoji as currencyEmoji 
        FROM transaction 
        LEFT JOIN currency ON transaction.currencyid = currency.id 
        WHERE transaction.userid = ?
        ORDER BY transaction.id DESC`;

      const [rows] = await pool.execute(sql, [snowflake]);
      return rows;
    },
    /** gets the leaderboard for a specific currency, sorted by total amount of that currency each user has, limited to a specified number of users
      * @param {number} currencyId the ID of the currency to get the leaderboard for
      * @param {number} [limit=10] the number of users to return in the leaderboard
       * @returns {LeaderboardEntryObject[]} an array of user currency total objects representing the leaderboard for that currency, sorted by total amount of that currency each user has
    */

    /** 
     * Gets the leaderboard for a specific currency, sorted by total amount
     * @param {number} currencyId the ID of the currency to get the leaderboard for
     * @param {number} [limit=10] the number of users to return in the leaderboard
     * @returns {Promise<LeaderboardEntryObject[]>} an array of user currency total objects
     */
    getLeaderboard: async (currencyId, limit = 10) => {
      const currency = ValidCurrenciesCache.find(c => c.id == currencyId);
      if (!currency) throw new Error("Invalid currency ID");

      const sql = `
        SELECT users.snowflake, users.username, SUM(transaction.amount) as total, 
               currency.name as currencyName, currency.emoji as currencyEmoji 
        FROM users 
        LEFT JOIN transaction ON users.snowflake = transaction.userid
        LEFT JOIN currency ON transaction.currencyid = currency.id 
        WHERE transaction.currencyid = ? AND currency.active = 1 
        GROUP BY users.snowflake 
        ORDER BY total DESC 
        LIMIT ?`;

      // parseInt is important here because passing a string to a ? for a LIMIT clause throws a syntax error in some MySQL versions
      const [rows] = await pool.execute(sql, [currencyId, parseInt(limit)]);

      return rows.map(entry =>
        new LeaderboardEntryObject(
          entry.snowflake,
          entry.username,
          entry.total,
          entry.currencyName,
          entry.currencyEmoji
        )
      );
    }
  },
  /**
   * Initiates the database connection and synchronizes caches
   * @param {Object} Module
   * @param {Discord.Client} Module.client the only required member of a module object in order to initialize the database
   */
  init: async (Module) => {
    client = Module.client;

    if (!hasBeenInitialized) {
      //initialize the database connection
      pool = mysql.createPool({
        host: Module.client.config.mySQL.host,
        user: Module.client.config.mySQL.user,
        password: Module.client.config.mySQL.password,
        database: Module.client.config.mySQL.database,
        port: Module.client.config.mySQL.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        idleTimeout: 60000, // 60 seconds
        enableKeepAlive: true,
        keepAliveInitialDelay: 30000 // 30 seconds
      });

      try {
        // Ping the database to verify the connection pool is alive and ready
        let con = await pool.getConnection();
        await con.ping();
        con.release();
        pool.on('error', (err) => {
          errorHandler(err, "Database connection error");
        });
        console.log("Connected to DataBase!");
        hasBeenInitialized = true;
      } catch (err) {
        errorHandler(err, "Error establishing database connection. Please check your database configuration and ensure the database server is running.");
        throw err; // Rethrow to prevent the bot from starting without a database connection
      }
    }

    try {
      // 1. Initialize the currency cache
      await DataBaseActions.Economy.getValidCurrencies();

      // 2. Synchronize Guilds
      const dbGuilds = await DataBaseActions.Guild.getAll();

      // Use a for...of loop so we can await each insertion sequentially.
      const guilds = await client.guilds.fetch();
      for (const guild of guilds.values()) {

        // If the guild from Discord is not found in our Database cache
        if (!dbGuilds.find(g => g.snowflake === guild.id)) {

          // Get all non-managed roles in the guild
          const roles = await guild.roles.fetch();
          for (const role of roles.values()) {
            if (!role.managed) {
              roles.push(new DBGuildRoleObject({
                snowflake: role.id,
                friendly_name: role.name,
                has_redacted_info: false,
                is_update_role: false
              }));
            }
          }

          const newGuild = new DBGuildObject({
            snowflake: guild.id,
            friendly_name: guild.name,
            isTestGuild: false,
            roles: roles
          });

          // Insert into the database
          try {
            await DataBaseActions.Guild.new(newGuild);
            console.log(`Added guild ${guild.name} to the database.`);
          } catch (err) {
            console.error(`Error adding guild ${guild.name} to the database:`, err);
          }
        }
      }
    } catch (err) {
      console.error("Error loading caches or synchronizing guilds:", err);
    }
  }
}

module.exports = DataBaseActions;