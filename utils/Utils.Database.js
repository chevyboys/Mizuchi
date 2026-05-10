const mysql = require("mysql2/promise"); // Updated to mysql2
const Discord = require("discord.js");
const snowflakes = require("../config/snowflakes.json");
const config = require("../config/config.json");

let hasBeenInitialized = false;
let client;
let con; // This will hold our promise-based connection

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
function parsesnowflake(user) {
  const snowflake = user?.id || user?.snowflake?.user?.id || user?.snowflake?.snowflake || user?.snowflake || user?.Id || user;
  if (!assertIsSnowflake(snowflake)) {
    throw new Error(`INVALID DISCORD ID: ${JSON.stringify(user)}`);
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

  // Legacy support: If it's just an array, assign to Primary Server
  if (Array.isArray(parsedRoles)) {
    return {
      [snowflakes.guilds.PrimaryServer]: parsedRoles.filter(assertIsSnowflake)
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
  constructor(constructionObj) {
    if (constructionObj instanceof DBUserObject) return constructionObj;

    this.id = constructionObj.id || null;
    this.snowflake = parsesnowflake(constructionObj.snowflake);
    this.username = cleanString(constructionObj.username) || "Unknown User";

    // Validate Cake Day, default to "opt-out" if invalid/missing
    this.cakeday = assertIsCakeDay(constructionObj.cakeday) ? constructionObj.cakeday : "opt-out";
    this.cakeyear = parseInt(constructionObj.cakeyear) || new Date().getFullYear();

    // This maintains legacy roles while we migrate to the relational tables
    this.roles = normalizeRolesByGuild(constructionObj.roles);
  }

  /**
   * Refreshes user data from DB
   */
  async get(guildsnowflake) {
    return await DataBaseActions.User.get(this.snowflake, guildsnowflake);
  }

  async updateCakeDay(cakeday, guildsnowflake) {
    if (!assertIsCakeDay(cakeday)) throw new Error("Invalid Cake Day format");
    return await privateDataBaseActions.User.update({ snowflake: this.snowflake, cakeday }, guildsnowflake);
  }

  async updateCakeYear(cakeyear, guildsnowflake) {
    const year = parseInt(cakeyear);
    if (isNaN(year)) throw new Error("Invalid Cake Year");
    return await privateDataBaseActions.User.update({ snowflake: this.snowflake, cakeyear: year }, guildsnowflake);
  }

  async updateRoles(guildsnowflake) {
    const guild = await client.guilds.fetch(guildsnowflake);
    const member = await guild.members.fetch(this.snowflake);
    return privateDataBaseActions.User.update({ snowflake: this.snowflake, roles: member.roles.cache.map(r => r.id) }, guildsnowflake);
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
  constructor(constructionObj) {
    if (constructionObj instanceof DBGuildObject) return constructionObj;

    this.id = constructionObj.id || null;
    this.snowflake = parsesnowflake(constructionObj.snowflake);
    this.friendly_name = cleanString(constructionObj.friendly_name);
    this.isTestGuild = !!constructionObj.isTestGuild;
    this.roles = Array.isArray(constructionObj.roles)
      ? constructionObj.roles.map(role => new DBGuildRoleObject(role))
      : [];
  }
}
/**
 * Data Model for Roles
 * @member {Discord.Snowflake} snowflake the id of the role to store
 * @member {string} friendly_name a human friendly name for the role, stored for ease of use in the database and testing, should not be referenced in code
 * @member {boolean} has_redacted_info whether the role has redacted information
 * @member {boolean} is_update_role whether the role is an update role
 */
class DBGuildRoleObject {
  constructor(constructionObj) {
    if (constructionObj instanceof DBGuildRoleObject) return constructionObj;

    this.id = constructionObj.id || null;
    this.snowflake = parsesnowflake(constructionObj.snowflake);
    this.friendly_name = cleanString(constructionObj.friendly_name) || "Unknown Role";

    // Explicitly parse these as booleans so they never default to undefined
    this.has_redacted_info = !!constructionObj.has_redacted_info;
    this.is_update_role = !!constructionObj.is_update_role;
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

          await privateDataBaseActions.User.syncRoles(user.id, guildSnowflake, roleList);
        }

        await con.commit();
        // Return the updated object
        return await DataBaseActions.User.get(snowflake, guildSnowflake);
      } catch (error) {
        await con.rollback();
        console.error(`Failed to update user ${snowflake}. Changes rolled back.`, error);
        throw error;
      }
    },

    /**
     * Synchronizes the many-to-many relationship for roles.
     * @param {number} internalUserId - The 'id' (double/auto_increment) from the users table.
     * @param {string} guildSnowflake - The Discord snowflake for the guild.
     * @param {string[]} roleSnowflakes - Array of role snowflakes the user should have.
     * @returns {Promise<void>} Resolves when the roles have been synchronized.
     */
    syncRoles: async (internalUserId, guildSnowflake, roleSnowflakes) => {
      // 1. Get internal Guild ID
      const [[dbGuild]] = await DataBaseActions.Guild.get(guildSnowflake);
      if (!dbGuild) throw new Error(`Guild ${guildSnowflake} not found in database.`);

      // 2. Clear existing roles for this user in this specific guild
      // We join on guild_role to ensure we don't accidentally delete roles from other servers
      const deleteSql = `
        DELETE ugr FROM user_guild_role ugr
        INNER JOIN guild_role gr ON ugr.guild_role_id = gr.id
        WHERE ugr.user_id = ? AND gr.guild_id = ?`;

      await con.execute(deleteSql, [internalUserId, dbGuild.id]);

      // 3. Process new roles
      for (const rSnowflake of roleSnowflakes) {
        if (!assertIsSnowflake(rSnowflake)) continue;

        // Ensure the role exists in the guild_role table first
        // We use INSERT IGNORE so we don't crash if the role is already there
        await con.execute(`
          INSERT INTO guild_role (guild_id, snowflake, friendly_name) 
          VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE snowflake = snowflake, friendly_name = VALUES(friendly_name)`,
          [dbGuild.id, rSnowflake, `Role ${rSnowflake}`]
        );

        // Link the user to the role via the relational table
        await con.execute(`
          INSERT INTO user_guild_role (user_id, guild_role_id)
          SELECT ?, id FROM guild_role WHERE snowflake = ? AND guild_id = ? ON DUPLICATE KEY UPDATE user_id = user_id`,
          [internalUserId, rSnowflake, dbGuild.id]
        );
      }
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
      await con.execute('UPDATE guild SET friendly_name = ? WHERE snowflake = ?', [newName, snowflake]);
      return true;
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

const DataBaseActions = {
  // classes, for easier use in other files
  DBCurrencyObject,
  DBCurrencyTotalObject,
  DBUserCurrencyTotalObject,
  DBUserObject,
  LeaderboardEntryObject,
  DBGuildObject,
  DBGuildRoleObject,
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

      const [userRows] = await con.execute(userSql, [snowflake, guild_snowflake]);

      if (!userRows || userRows.length === 0) return null;
      let user = userRows[0];
      const roleSql = `
        SELECT guild_role.snowflake as snowflake 
        FROM user_guild_role 
        LEFT JOIN users on user_guild_role.user_id = users.id 
        LEFT JOIN guild_role on user_guild_role.guild_role_id = guild_role.id 
        LEFT JOIN guild on guild_role.guild_id = guild.id 
        WHERE users.snowflake = ? AND guild.snowflake = ?`;

      const [roleRows] = await con.execute(roleSql, [snowflake, guild_snowflake]);

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
        LEFT JOIN transaction ON users.snowflake = transaction.snowflake 
        LEFT JOIN currency ON currency.id = transaction.currencyid 
        WHERE users.snowflake = ? AND currency.active 
        GROUP BY currency.id 
        ORDER BY currency.id`;

      const [rows] = await con.execute(query, [snowflake]);

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

      const [rows] = await con.execute(query, [guild_snowflake]);

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
        LEFT JOIN user_guild ON users.id = user_guild.user_id 
        LEFT JOIN guild ON user_guild.guild_id = guild.id 
        LEFT JOIN user_guild_role ON user_guild_role.user_guild_id = user_guild.id 
        LEFT JOIN guild_role ON user_guild_role.guild_role_id = guild_role.id 
        WHERE guild.snowflake = ? AND count(guild_role.id) > 1 
        GROUP BY users.snowflake`;

      const [rows] = await con.execute(query, [guild_snowflake]);

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
        const primaryGuild = client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
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

        await con.execute(sql, [snowflake, username]);

        const sql2 = `
          INSERT INTO \`user_guild\` (\`user_id\`, \`guild_id\`)
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE user_id = values(user_id), guild_id = values(guild_id)`;

        await con.execute(sql2, [snowflake, guildsnowflake]);

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

      const [rows] = await con.execute(sql, [snowflake, guild_snowflake]);

      // If the array has anything in it, they have a sensitive role!
      return rows.length > 0;
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

      const [guildRows] = await con.execute("SELECT * FROM guild WHERE snowflake = ?", [snowflake]);

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

      const [roleRows] = await con.execute(roleSql, [snowflake]);
      guild.roles = roleRows.map(role => new DBGuildRoleObject(role));

      return new DBGuildObject(guild);
    },

    /**
        * Gets all guilds in the database with their associated roles.
        */
    getAll: async () => {
      const [guildRows] = await con.execute("SELECT * FROM guild");

      // Use Promise.all to fetch roles for all guilds concurrently
      const promises = guildRows.map(async (guild) => {
        const roleSql = `
          SELECT guild_role.* 
          FROM guild_role 
          LEFT JOIN guild on guild_role.guild_id = guild.id 
          WHERE guild.snowflake = ?`;

        const [roleRows] = await con.execute(roleSql, [guild.snowflake]);

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
      await con.execute(sql, [snowflake, dbGuildObject.friendly_name ?? '', dbGuildObject.isTestGuild ? 1 : 0]);

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
            await con.execute(roleSql, [
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
      const [result] = await con.execute("UPDATE guild SET isTestGuild = ? WHERE snowflake = ?", [isTestGuild, snowflake]);
      return result;
    },

    update_friendly_name: async (snowflakeResolvable, newFriendlyName) => {
      const snowflake = parsesnowflake(snowflakeResolvable);
      const [result] = await con.execute("UPDATE guild SET friendly_name = ? WHERE snowflake = ?", [newFriendlyName, snowflake]);
      return result;
    },

    update_roles: async (snowflakeResolvable, roles) => {
      const snowflake = parsesnowflake(snowflakeResolvable);

      const guild = await DataBaseActions.Guild.get(snowflake);
      if (!guild) throw new Error("Guild not found");

      // Get internal database ID for the guild
      const [guildIdResult] = await con.execute("SELECT id FROM guild WHERE snowflake = ?", [snowflake]);
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
              await con.execute(updateSql, [
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
            await con.execute(insertSql, [
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
          const [rows] = await con.execute("SELECT * FROM currency WHERE active = 1");

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

      const [result] = await con.execute(sql, [
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

      const [rows] = await con.execute(sql, [snowflake]);
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
      const [rows] = await con.execute(sql, [currencyId, parseInt(limit)]);

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
      con = await mysql.createConnection({
        host: config.mySQL.host,
        user: config.mySQL.user,
        password: config.mySQL.password,
        database: config.mySQL.database,
        port: config.mySQL.port
      });

      try {
        // Ping the database to verify the single connection is alive and ready
        await con.ping();
        console.log("Connected to DataBase!");
        hasBeenInitialized = true;
      } catch (err) {
        console.error("Failed to establish Database connection:", err);
        throw err; // Halt initialization if the DB is unreachable
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