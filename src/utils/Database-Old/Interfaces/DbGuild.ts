import { Collection, Snowflake } from "discord.js";
import { IDbGuildAuthor } from "./DbAuthor";
import { IDbClass } from "./DbGeneral";
import { IDbLink } from "./DbLink";


export interface IDbGuild extends IDbClass {
    id: Snowflake,
    name: string,
    welcome: IDbGuildWelcome,
    channels: IDbGuildChannels,
    roles: Collection<Snowflake, IDbGuildRole>,
    faqs: Collection<string, IDbGuildFaq>,
    links: IDbLink[],
    authors: Collection<number, IDbGuildAuthor>,
    wikiLink?: string,
    emoji?: Collection<string, IDbGuildEmoji>;


}

export interface IDbGuildWelcome {
    title?: string,
    type: DbGuildWelcomeTypes,
    image?: string,
    expiration?: Date,
    string?: string
}

export enum DbGuildWelcomeTypes {
    prepend,
    embed,
    append,
    insert,
    override,
    disabled
}

export interface IDbGuildChannels {
    questionQueue?: Snowflake,
    publicCommands?: Snowflake,
    questionDiscussion?: Snowflake,
    adminCommands?: Snowflake,
    faq?: Snowflake,
    general?: Snowflake,
    introduction?: Snowflake,
    modRequest?: Snowflake,
    roles?: Snowflake,
    rules?: Snowflake,
    secret?: Snowflake,
    spoilerPolicy?: Snowflake,
}

export interface IDbGuildRole extends IDbClass {
    id: Snowflake,
    duties: DbGuildRoleDuty[],
    sensativeData?: boolean
}

export enum DbGuildRoleDuty {
    BotTeam,
    Admin,
    CakeDay,
    CommunityGuide,
    Helper,
    Holiday,
    LARPer,
    Moderator,
    Update,
    AllUpdates,
}

export interface IDbGuildFaq extends IDbClass {
    name: string,
    messageId?: Snowflake,
    expiration?: Date,
    questions: IDbFaqQuestion[],
}

export interface IDbFaqQuestion {
    question: string,
    answer: string,
}

export interface IDbGuildEmoji {
    duty: DbGuildEmojiDuty,
    emoji: string
}

export enum DbGuildEmojiDuty {
    Upvote,
    Unvote,
    Bot,
    Confirm,
    Deny,
}