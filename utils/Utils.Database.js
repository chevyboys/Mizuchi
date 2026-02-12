const mysql = require("mysql")
const Discord = require("discord.js");
const snowflakes = require("../config/snowflakes.json")
const config = require("../config/config.json")
let hasBeenInitialized = false;
// Ensure charset is set in the connection string
let connectionString = config.mySQL;
if (typeof connectionString === 'string') {
  if (connectionString.includes('?')) {
    connectionString += '&charset=utf8mb4';
  } else {
    connectionString += '?charset=utf8mb4';
  }
}
const con = mysql.createConnection(connectionString);
const Augur = require("augurbot");
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const days = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]
let client;


function cleanString(str) {
  return str.replace(/[\W_]+/g, " ");;
}
async function assertIsSnowflake(snowflake) {
  await snowflake;
  let discordEpoch = Date.parse("01 Jan 2015 00:00:00 GMT");
  let timestamp = new Date(Discord.SnowflakeUtil.timestampFrom(snowflake))
  if (!/^\d+$/.test(snowflake) || timestamp <= discordEpoch || timestamp > Date.now()) {
    return false
  } else return true;
}
/** 
 * @param {string} string the string to check if it is in fact a cake day
*/
function assertIsCakeDay(string) {
  if (string == "opt-out") return true;
  if (string.length == 6 || string.length == 5 || string.length == 7) {
    let parts = string.split(" ");
    if (parts.length == 2 && months.includes(parts[0].replace(" ", "")) && days.includes(parts[1].replace(" ", ""))) {
      return true
    }
  }
  throw (string + ":" + JSON.stringify(string) + " is not a valid CakeDay")
}
function parseUserID(user) {
  let userID = user.id || user.userID?.user?.id || user.userID?.userId || user.userID || user.Id || user;
  if (!assertIsSnowflake(userID)) {
    reject("INVALID DISCORD ID at Database.parseUserID: " + JSON.stringify(user));
  }
  else return userID;
}


/**
 * An object representing the user object in the database
 * @member {Discord.Snowflake} userID the user or member id of the person to store
 * @member {string} username //a cleaned version of the username. Stored only for convenience, should not be referenced.
 * @member {string} cakeDay // A cakeDay string e.g. Jan 01
 * @member {number} currentXP = 0] // Does nothing currently. Will be ignored
 * @member {number} totalXP = 0] // Does nothing currently. Will be ignored
 * @member {Discord.Role.Id[]} roles // An array of the roles the discord member has
 */
class DBUserObject {
  userID = "";
  username = "";
  cakeDay = "";
  currentXP = 0;
  totalXP = 0;
  roles = [];

  /**
   * Creates a DBUserObject
   * @param {Object} constructionObj the basic construction object
   * @param {Discord.Snowflake} constructionObj.userID the user or member id of the person to store
   * @param {string} constructionObj.username //a cleaned version of the username. Stored only for convenience, should not be referenced.
   * @param {string} constructionObj.cakeDay // A cakeDay string e.g. Jan 01
   * @param {number} [constructionObj.currentXP = 0] // Does nothing currently. Will be ignored
   * @param {number} [constructionObj.totalXP = 0] // Does nothing currently. Will be ignored
   * @param {Discord.Role.Id[]} constructionObj.roles // An array of the roles the discord member has
   */

  constructor(constructionObj) {
    this.userID = parseUserID(constructionObj.userID);
    this.username = cleanString(constructionObj.username);
    this.cakeDay = assertIsCakeDay(constructionObj.cakeDay) ? constructionObj.cakeDay : null;
    this.currentXP = 0;
    this.totalXP = 0;
    let parsedRoles;
    if (typeof constructionObj.roles === 'string' || constructionObj.roles instanceof String) {
      parsedRoles = JSON.parse(constructionObj.roles)
    }
    else parsedRoles = constructionObj.roles
    this.roles = parsedRoles.map(r => r.id ? (assertIsSnowflake(r.id) ? r.id : null) : (assertIsSnowflake(r) ? r : null));
  }
  /**
   * Gets this user from the database
   * @returns {DBUserObject} the database user object for the user, if it exists 
   */
  get = async () => { return await DataBaseActions.User.get(this.userID); }
  /**
   * sets cakeday for a user to a specific date
   * @param {string} cakeDay 
   * @returns {Object} the result of the database update
   */
  updateCakeDay = async (cakeDay) => { return await DataBaseActions.User.updateCakeDay(this.userID, cakeDay) };
  /**
   * Updates the roles array for a guild member
   * @returns {Object} the result of the database update
   */
  updateRoles = async () => {
    let guild = await client.guilds.fetch(snowflakes.guilds.PrimaryServer)
    let member = await guild.members.fetch()
    return await DataBaseActions.User.updateRoles(member);
  }
}

let privateDataBaseActions = {
  User: {
    UserObject: DBUserObject,
    /**
             * Update will find a user and update their records, or if the user doesn't exist, it will create them, then update them
             * @param {Object} userDataBaseObject - An object containing member variables named each column you wish to change for the user, with the values equalling the new value.
             * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} userDataBaseObject.userID - The ID of the user to find, or an object that has an ID;
             * @param {string} [userDataBaseObject.cakeDay] - the MM-DD formatted day to celebrate this person
             * @param {number} [userDataBaseObject.currentXP] - the XP the user has in the current season
             * @param {number} [userDataBaseObject.totalXP] - the XP the user has in total
             */
    update: async (userDataBaseObject) => {
      let userID = parseUserID(userDataBaseObject);
      let user = await DataBaseActions.User.get(userID)
      if (!user) {
        user = await DataBaseActions.User.new(userID);
      }
      if (user.roles && Array.isArray(user.roles)) {
        user.roles = JSON.stringify(user.roles)
      }
      //only set properties that we already have in the database as a column. If not specified, leave it the same.
      let query = `UPDATE users SET `
      for (const property in user) {
        if (property != "userID" && typeof user[property] != "function" && !(user[property] instanceof Function) && Object.prototype.toString.call(user[property]) != '[object Function]') {
          user[property] = userDataBaseObject[property] || user[property];
          if (typeof user[property] === 'string' || user[property] instanceof String) {
            query = query + ` ${property} = ${con.escape(user[property])},`
          } else {
            query = query + ` ${property} = ${con.escape(user[property])},`
          }

        }
      }

      query = query.slice(0, -1) + ` WHERE userID=${con.escape(userID)}`;
      return new Promise((fulfill, reject) => {
        con.query(query, function (error, result) {
          if (error) reject(error);
          else fulfill(user);
        });

      })

    },
  }
}

class DBUserCurrencyTotalObject {
  userID = "";
  currencies = [];
  /**
   * 
   * @param {Discord.Snowflake} userID 
   * @param {DBCurrencyTotalObject[]} currencies 
   */
  constructor(userID, currencies) {
    this.userID = userID;
    this.currencies = currencies;
  }
}

class DBCurrencyTotalObject {
  constructor(id, name, emoji, total) {
    this.id = id;
    this.name = name;
    this.emoji = emoji;
    this.total = total;
  }
}

class DBCurrencyObject {
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
  constructor(userID, username, total, currencyName, currencyEmoji) {
    this.userID = userID;
    this.username = username;
    this.total = total;
    this.currencyName = currencyName;
    this.currencyEmoji = currencyEmoji;
  }
}



let DataBaseActions = {
  //classes, for easier use in other files
  DBCurrencyObject,
  DBCurrencyTotalObject,
  DBUserCurrencyTotalObject,
  DBUserObject,
  LeaderboardEntryObject,
  User: {
    /** gets all the info a database has about a user, and returns it as a DBUserObject
     * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} userIdResolvable - The ID of the user to find, or an object that has an ID;
     * @returns {DBUserObject} the database user object for the user, if it exists 
    */
    get: async (userIdResolvable) => {
      await userIdResolvable;
      let userID = await parseUserID(userIdResolvable);

      return new Promise((fulfill, reject) => {
        con.query("SELECT * FROM users WHERE userID=" + con.escape(userID), function (error, result) {
          if (!result || result == undefined) {
            reject("No user with that ID was found")
          } else {
            let user = JSON.parse(JSON.stringify(result))[0];
            if (!user || user == undefined) fulfill(null);
            else {
              user.roles = JSON.parse(user.roles)
              if (error) reject(error);
              else fulfill(new DBUserObject(user));
            }
          }

        });
      });
    },
    /**
     * gets the currency information for a user from the database
     * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} userIdResolvable 
     * @returns {DBUserCurrencyTotalObject} the database user currency object for the user, if it exists 
     */
    getBalance: async (userIdResolvable) => {
      await userIdResolvable;
      let userID = await parseUserID(userIdResolvable);

      return new Promise((fulfill, reject) => {
        let query = "SELECT currency.name as name, currency.emoji as emoji, currency.id as id, SUM(amount) as total FROM users" +
          " LEFT JOIN transaction ON users.userID = transaction.userid" +
          " LEFT JOIN currency ON currency.id = transaction.currencyid" +
          " WHERE users.userID=" + con.escape(userID) + " AND currency.active GROUP BY currency.id ORDER BY currency.id";
        con.query(query, function (error, result) {
          if (!result || result == undefined) {
            reject("No transactions for userID " + userID + " were found. Trying SQL:" + query);
          } else {
            let userCurrencyArray = [];
            let resultArray = JSON.parse(JSON.stringify(result));
            resultArray.forEach(element => {
              //each element should be an entry object with the name of the currency, the id of the currency, and the total amount of that currency the user has
              userCurrencyArray.push(new DBCurrencyTotalObject(element.id, element.name, element.emoji, element.total));
            });
            if (error) reject(error);
            else fulfill(new DBUserCurrencyTotalObject(userID, userCurrencyArray));
          }

        });
      });
    },

    /** gets all the info a database has about all users, and returns it as a DataBaseUser object array
     * @returns {DBUserObject[]} the database user objects if they exist
    */
    getAll: () => {
      let query = `SELECT * FROM users`
      return new Promise((fulfill, reject) => {
        con.query(query, function (error, result) {
          if (error) reject(error);
          else {
            let arrayOfUsers = JSON.parse(JSON.stringify(result));
            let returnableArray = arrayOfUsers.map(user => new DBUserObject(user));
            fulfill(returnableArray);
          }
        });
      });
    },
    /** gets all the info a database has about all users who have at least one non-everyone role, and returns it as a DataBaseUser object array
     * @returns {DBUserObject[]} the database user objects if they exist
    */
    getMost: () => {
      let query = "SELECT * FROM `users` WHERE LENGTH(`roles`) > 25"
      return new Promise((fulfill, reject) => {
        con.query(query, function (error, result) {
          if (error) reject(error);
          else {
            let arrayOfUsers = JSON.parse(JSON.stringify(result));
            let returnableArray = arrayOfUsers.map(user => new DBUserObject(user));
            fulfill(returnableArray);
          }
        });
      });
    },
    /**
     * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake|DBUserObject.userID|DBUserObject)} userID - The ID of the user to find, or an object that has an ID;
     */
    new: async (userID) => {
      userID = parseUserID(userID);
      let exists = await DataBaseActions.User.get(userID)
      if (exists != null) return exists;
      else {
        return new Promise((fulfill, reject) => {
          let cakeDay = "opt-out";
          let username = cleanString(client.guilds.cache.get(snowflakes.guilds.PrimaryServer).members.cache.get(userID).displayName);
          let roles = client.guilds.cache.get(snowflakes.guilds.PrimaryServer).members.cache.get(userID).roles.cache.map(r => assertIsSnowflake(r.id) ? r.id : null);
          //cakeDay = months[cakeDay.getMonth()] + " " + cakeDay.getDate();

          let newMember = {
            userID: userID,
            username: username,
            cakeDay: assertIsCakeDay(cakeDay) ? cakeDay : null,
            currentXP: 0,
            totalXP: 0,
            roles: roles
          }

          let sql = `INSERT INTO \`users\` (\`userID\`, \`username\`, \`cakeDay\`, \`currentXP\`, \`totalXP\`, \`roles\`) VALUES (${con.escape(newMember.userID)}, ${con.escape(newMember.username)}, ${con.escape(newMember.cakeDay)}, ${con.escape(newMember.currentXP)}, ${con.escape(newMember.totalXP)}, ${con.escape(JSON.stringify(newMember.roles))})`;
          con.query(sql, function (error, result) {
            if (error) reject(error);
            else fulfill(newMember);
          });

        })
      };
    },
    /**
     * Updates a guild member's roles listed in the database
     * @param {Discord.guildMember} guildMember 
     *  @returns {Object} the result of the database update 
     */
    updateRoles: async (guildMember) => {
      if (assertIsSnowflake(guildMember.id)) {
        return await privateDataBaseActions.User.update({ id: guildMember.id, roles: JSON.stringify(guildMember.roles.cache.map(r => assertIsSnowflake(r.id) ? r.id : null)) })
      }
    },
    /**
     * Updates a guild member's cakeday listed in the database
     * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake|DBUserObject.userID|DBUserObject)} userIdResolvable the user id or an object containing it in a resolvable form
     * @param {string} cakeDay the cakeday string
     * @returns 
     */
    updateCakeDay: async (userIdResolvable, cakeDay) => {
      userID = parseUserID(userIdResolvable) || null;
      return await privateDataBaseActions.User.update({ id: userID, cakeDay: assertIsCakeDay(cakeDay) ? cakeDay : null })
    }
  },
  Economy: {
    /** gets all the valid currencies from the cache
      * @returns {DBCurrencyObject[]} the valid currency objects if they exist
    */
    getValidCurrencies: async () => {
      if (ValidCurrenciesCache.length == 0) {
        con.query("SELECT * FROM currency WHERE active;", function (error, result) {
          if (error) console.log("Error loading currency cache: " + error);
          else {
            let arrayOfCurrencies = JSON.parse(JSON.stringify(result));
            arrayOfCurrencies.forEach(currency => {
              ValidCurrenciesCache.push(new DBCurrencyObject(currency.id, currency.name, currency.emoji));
            });
            console.log("Currency cache loaded with " + arrayOfCurrencies.length + " currencies.")
          }
        });

      }
      return ValidCurrenciesCache;
    },
    /**
     * Creates a new transaction in the database
     * @param {Discord.User|Discord.GuildMember|Discord.Snowflake|DBUserObject.userID|DBUserObject} userIdResolvable 
     * @param {number} currencyId 
     * @param {number} amount 
     * @param {Discord.User|Discord.GuildMember|Discord.Snowflake|DBUserObject.userID|DBUserObject} initiatedByUserIdResolvable 
     * @returns 
     */
    newTransaction: async (userIdResolvable, currencyId, amount, initiatedByUserIdResolvable) => {
      await userIdResolvable;
      let userID = await parseUserID(userIdResolvable);
      let initatedbyuserid = await parseUserID(initiatedByUserIdResolvable);
      let currency = ValidCurrenciesCache.find(c => c.id == currencyId);
      if (!currency) throw new Error("Invalid currency ID");
      return new Promise((fulfill, reject) => {
        let sql = `INSERT INTO \`transaction\` (\`userID\`, \`currencyID\`, \`amount\`, \`initatedbyuserid\`) VALUES (${con.escape(userID)}, ${con.escape(currencyId)}, ${con.escape(amount)}, ${con.escape(initatedbyuserid)})`;
        con.query(sql, function (error, result) {
          if (error) reject(error);
          else fulfill(result);
        });
      })
    },

    getTransactionHistory: async (userIdResolvable) => {
      await userIdResolvable;
      let userID = await parseUserID(userIdResolvable);
      return new Promise((fulfill, reject) => {
        let sql = `SELECT transaction.*, currency.name as currencyName, currency.emoji as currencyEmoji FROM transaction LEFT JOIN currency ON transaction.currencyid = currency.id WHERE transaction.userid=${con.escape(userID)} ORDER BY transaction.id DESC`;
        con.query(sql, function (error, result) {
          if (error) reject(error);
          else fulfill(result);
        });
      })
    },
    /** gets the leaderboard for a specific currency, sorted by total amount of that currency each user has, limited to a specified number of users
      * @param {number} currencyId the ID of the currency to get the leaderboard for
      * @param {number} [limit=10] the number of users to return in the leaderboard
       * @returns {LeaderboardEntryObject[]} an array of user currency total objects representing the leaderboard for that currency, sorted by total amount of that currency each user has
    */

    getLeaderboard: async (currencyId, limit = 10) => {
      let currency = ValidCurrenciesCache[ValidCurrenciesCache.findIndex(c => c.id == currencyId)];
      if (!currency) throw new Error("Invalid currency ID");
      return new Promise((fulfill, reject) => {
        let sql = `SELECT users.userID, users.username, SUM(transaction.amount) as total, currency.name as currencyName, currency.emoji as currencyEmoji FROM users LEFT JOIN transaction ON users.userID = transaction.userid LEFT JOIN currency ON transaction.currencyid = currency.id WHERE transaction.currencyid=${con.escape(currencyId)} AND currency.active GROUP BY users.userID ORDER BY total DESC LIMIT ${con.escape(limit)}`;
        con.query(sql, function (error, result) {
          if (error) reject(error);
          else fulfill(new Array(...result).map(entry => new LeaderboardEntryObject(entry.userID, entry.username, entry.total, entry.currencyName, entry.currencyEmoji)));
        });
      })
    }

  },
  /**
   * Initiates the database connection
   * @param {Object} Module
   * @param {Discord.Client} Module.client the only required member of a module object in order to initialize the database
   * @returns 
   */
  init: (Module) => {
    client = Module.client;
    if (!hasBeenInitialized) {
      con.connect(function (err) {
        if (err && !err.toString().indexOf("Cannot enqueue Handshake after already enqueuing a Handshake") > -1) throw err;
        console.log("Connected to DataBase!");
      })
      hasBeenInitialized = true;
    }
    // initialize the currency cache
    DataBaseActions.Economy.getValidCurrencies();
    return con;
  }

}

module.exports = DataBaseActions