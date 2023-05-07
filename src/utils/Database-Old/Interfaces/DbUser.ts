import { Collection, Snowflake } from "discord.js";

export interface IDbUser {
    id: Snowflake,
    guilds: Collection<Snowflake, IDbUserGuild>
}

export interface IDbUserGuild {
    guildId: Snowflake,
    helperExperation?: Date,
    cakeday: string,
    totalXp: number,
    currentXp: number
    roles: Array<Snowflake>
}