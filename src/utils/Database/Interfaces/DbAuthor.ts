import { Snowflake } from "discord.js";
import { IDbClass } from "./DbGeneral";
import { IDbLink } from "./DbLink";


export interface IDbGuildAuthor extends IDbClass {
    id: Snowflake,
    name: string,
    color?: string,
    blog: IDbGuildAuthorBlog,
    answerChannel?: Snowflake,
    imageUrl: string,
    links: IDbLink[],
    guildId: Snowflake,
}

export interface IDbGuildAuthorBlog {
    api?: string,
    channel?: Snowflake,
    enabled?: boolean
}