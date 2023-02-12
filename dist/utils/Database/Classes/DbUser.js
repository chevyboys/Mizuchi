import { Collection } from "discord.js";
import { assertIsSnowflake, con } from "../DatabaseGeneral";
export class DbUser {
    id;
    guilds;
    constructor(options) {
        this.id = options.id;
        this.guilds = options.guilds;
    }
    static async get(optionId) {
        if (!assertIsSnowflake(optionId))
            throw new Error(optionId + " is not a valid guildId");
        let UserRows = await new Promise((fulfill, reject) => {
            con.query("SELECT `User`.`id`, `UserGuildRelationship`.`discordGuildId`, `UserGuildRelationship`.`helperExpirationDate`, `UserGuildRelationship`.`cakeday`, `UserGuildRelationship`.`currentXp`, `UserGuildRelationship`.`totalXp`, `GuildRoleTypeRelationship`.`discordRoleId` FROM `User` LEFT JOIN `UserGuildRelationship` ON `UserGuildRelationship`.`discordUserId` = `User`.`id` LEFT JOIN `UserGuildRoleRelationship` ON `UserGuildRoleRelationship`.`discordUserId` = `User`.`id` LEFT JOIN `GuildRoleTypeRelationship` ON `UserGuildRoleRelationship`.`guildRoleRelationshipId` = `GuildRoleTypeRelationship`.`id` WHERE `User`.`id` = " + con.escape(optionId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No user with that id was found");
                }
                else {
                    let x = result[0];
                    if (!x || x == undefined)
                        fulfill([]);
                    else {
                        if (error)
                            reject(error);
                        else
                            fulfill(result);
                    }
                }
            });
        });
        let UserGuilds = Collection.combineEntries(UserRows.map((row) => [row.discordGuildId, new DbUserGuild(row)]), (v1, v2) => {
            v1.roles = v1.roles.concat(v2.roles);
            return v1;
        });
        return new DbUser({
            id: optionId,
            guilds: UserGuilds
        });
    }
    ;
}
class DbUserGuild {
    guildId;
    helperExperation;
    cakeday;
    totalXp;
    currentXp;
    roles;
    constructor(options) {
        this.guildId = options.discordGuildId;
        this.helperExperation = options.helperExperationDate;
        this.cakeday = options.cakeday;
        this.totalXp = options.totalXp;
        this.currentXp = options.currentXp;
        this.roles = [options.discordRoleId];
    }
}
