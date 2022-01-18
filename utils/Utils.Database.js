const mysql = require("mysql")
const Discord = require("discord.js");
const snowflakes = require("../config/snowflakes.json")
const config = require("../config/config.json")
let hasBeenInitialized = false;
const con = mysql.createConnection(config.mySQL);
const Augur = require("augurbot")
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const days = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]

function cleanString(str) {
    return str.replace(/[\W_]+/g, " ");;
}
function assertIsSnowflake(snowflake) {
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
    if (string.length == 6) {
        let parts = string.split(" ");
        if (parts.length == 2 && months.has(parts[0].replace(" ", "")) && days.has(parts[1].replace(" ", ""))) {
            return true
        }
    }
    return false
}

function parseuserID(user) {
    let userID = user.userID?.user?.id || user.userID?.userId || user.id || user.userID || user.Id || user;
    if (!assertIsSnowflake(userID)) {
        throw "INVALD DISCORD ID at Database.ParseUserID: " + JSON.stringify(user);
    }
    return userID;
}

let privateDataBaseActions = {
    User: {
        /**
                 * Update will find a user and update their records, or if the user doesn't exist, it will create them, then update them
                 * @param {Augur.Module} Module - The Module this is being executed in. 
                 * @param {Object} userDataBaseObject - An object containing member variables named each collum you wish to change for the user, with the values equalling the new value.
                 * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} userDataBaseObject.userID - The ID of the user to find, or an object that has an ID;
                 * @param {string} [userDataBaseObject.cakeDay] - the MM-DD formatted day to celebrate this person
                 * @param {number} [userDataBaseObject.currentXP] - the XP the user has in the current season
                 * @param {number} [userDataBaseObject.totalXP] - the XP the user has in total
                 */
        update: async (Module, userDataBaseObject) => {
            let userID = parseuserID(userDataBaseObject);
            let user = await DataBaseActions.User.get(userID)
            if (!user) {
                user = await DataBaseActions.User.new(Module, userID);
            }
            //only set prooperties that we already have in the database as a colum. If not specified, leave it the same.
            let query = `UPDATE users SET `
            for (const property in user) {
                if (property != "userID") {
                    user[property] = userDataBaseObject[property] || user[property];
                    if (typeof user[property] === 'string' || user[property] instanceof String) {
                        query = query + ` ${property} = ${con.escape(user[property])},`
                    } else {
                        query = query + ` ${property} = ${con.escape(user[property])},`
                    }

                }
            }
            query = query.slice(0, -1) + ` WHERE userID=${con.escape(userID)}`;
            console.log("User Update SQL command '" + query + "'")
            return new Promise((fulfill, reject) => {
                con.query(query, function (error, result) {
                    if (error) reject(error);
                    else fulfill(user);
                    console.log(result);
                });

            })

        },
    }
}


let DataBaseActions = {
    User: {
        /** gets all the info a database has about a user, and returns it as a DataBaseUser object
         * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} userID - The ID of the user to find, or an object that has an ID;
         */
        get: (userID) => {
            userID = parseuserID(userID);

            return new Promise((fulfill, reject) => {
                con.query("SELECT * FROM users WHERE userID=" + con.escape(userID), function (error, result) {
                    let user = JSON.parse(JSON.stringify(result))[0];
                    if (!user || user == undefined) fulfill(null);
                    else {
                        console.log(JSON.stringify(user));
                        user.roles = JSON.parse(user.roles)
                        if (error) reject(error);
                        else fulfill(user);
                        console.log(result);
                    }

                });
            });
        },
        getAll: () => {
            let query = `SELECT * FROM users`
            return new Promise((fulfill, reject) => {
                con.query(query, function (error, result) {
                    if (error) reject(error);
                    else fulfill(JSON.parse(JSON.stringify(result)));
                    console.log(result);
                });
            });
        },

        /**
         * @param {(Discord.User|Discord.GuildMember|Discord.Snowflake)} userID - The ID of the user to find, or an object that has an ID;
         */
        new: async (Module, userID) => {
            userID = parseuserID(userID);
            let exists = await DataBaseActions.User.get(userID)
            if (exists != null) return exists;
            else {
                return new Promise((fulfill, reject) => {
                    let cakeDay = (Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)).members.cache.get(userID).joinedAt;
                    let username = cleanString(Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).members.cache.get(userID).displayName);
                    let roles = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).members.cache.get(userID).roles.cache.map(r => assertIsSnowflake(r.id) ? r.id : null);
                    cakeDay = months[cakeDay.getMonth()] + " " + cakeDay.getDate();

                    let newMember = {
                        userID: userID,
                        username: username,
                        cakeDay: assertIsCakeDay(cakeDay) ? cakeDay : null,
                        currentXP: 0,
                        totalXP: 0,
                        roles: roles
                    }

                    let sql = `INSERT INTO \`users\` (\`userID\`, \`username\`, \`cakeDay\`, \`currentXP\`, \`totalXP\`, \`roles\`) VALUES (${con.escape(newMember.userID)}, ${con.escape(newMember.username)}, ${con.escape(newMember.cakeDay)}, ${con.escape(newMember.currentXP)}, ${con.escape(newMember.totalXP)}, ${con.escape(JSON.stringify(newMember.roles))})`;
                    console.log(sql);
                    con.query(sql, function (error, result) {
                        if (error) reject(error);
                        else fulfill(newMember);
                        console.log(result);
                    });

                })
            };
        },
        updateRoles: async (Module, guildMember) => {
            if (assertIsSnowflake(guildMember.id)) {
                await privateDataBaseActions.User.update(Module, { id: guildMember.id, roles: JSON.stringify(guildMember.roles.cache.map(r => assertIsSnowflake(r.id) ? r.id : null)) })
            }
        },
        updateCakeDay: async (Module, userID, cakeDay) => {
            userID = parseuserID(userID) ? parseuserID : null;
            await privateDataBaseActions.User.update(Module, { id: userID, cakeDay: assertIsCakeDay(cakeDay) ? cakeDay : null })
        }
    },
    init: () => {
        if (!hasBeenInitialized) {
            con.connect(function (err) {
                if (err) throw err;
                console.log("Connected to DataBase!");
            })
            hasBeenInitialized = true;
        }
        return con;
    }

}

module.exports = DataBaseActions