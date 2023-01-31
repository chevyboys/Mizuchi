import * as mysql from "mysql";
import * as Discord from "discord.js";
import { configOptions } from "../config/config";
import { IChironClient } from "chironbot/dist/Headers/Client";
import { Collection, Snowflake } from "discord.js";
let hasBeenInitialized = false;
const con = mysql.createConnection(configOptions.database.mysql);

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const days = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]
let client: IChironClient;


function cleanString(str: string) {
    return str.replace(/[\W_]+/g, " ");;
}
function assertIsSnowflake(snowflake: string) {
    let discordEpoch = Date.parse("01 Jan 2015 00:00:00 GMT");
    let timestamp = new Date(Discord.SnowflakeUtil.timestampFrom(snowflake)).getTime()
    if (!/^\d+$/.test(snowflake) || timestamp <= discordEpoch || timestamp > Date.now()) {
        return false
    } else return true;
}

function assertIsCakeDay(string: string) {
    if (string == "opt-out") return true;
    if (string.length == 6 || string.length == 5 || string.length == 7) {
        let parts = string.split(" ");
        if (parts.length == 2 && months.includes(parts[0].replace(" ", "")) && days.includes(parts[1].replace(" ", ""))) {
            return true
        }
    }
    throw (string + ":" + JSON.stringify(string) + " is not a valid CakeDay")
}



export const DataBase = {
    User: {
        get: async (id: Snowflake): Promise<DbUser | null> => {
            if (!assertIsSnowflake(id)) {
                throw new Error(id + " is not a valid snowflake, I can't get that user")
            }
            return new Promise((fulfill, reject) => {
                con.query("SELECT * FROM User WHERE ID=" + con.escape(id), function (error, result) {
                    if (!result || result == undefined) {
                        reject("No user with that ID was found")
                    } else {
                        let user = JSON.parse(JSON.stringify(result))[0];
                        if (!user || user == undefined) fulfill(null);
                        else {
                            user.roles = JSON.parse(user.roles)
                            if (error) reject(error);
                            else fulfill(new DbUser(user));
                        }
                    }

                });
            });
        },
        //Guilds needs to be done before Users
        /* new: async (id: Snowflake): Promise<DbUser> => {
             if (!client) throw new Error("Client must be registered before attempting to make users!")
             if (assertIsSnowflake(id)) {
                 let existing = await DataBase.User.get(id);
                 if (existing instanceof DbUser) return existing;
 
                 //Start Creating Values.------------------------------
 
 
                 //Get all guilds the user is a part of;
                 let allGuilds = await (await client.guilds.fetch()).filter(g => !(g instanceof Discord.OAuth2Guild)) as unknown as Collection<Snowflake, Discord.Guild>;
                 let roles: Snowflake[] = [];
                 let guilds = allGuilds.filter(async (guild) => {
                     let member = await guild.members?.fetch(id);
                     roles.concat(member.roles.cache.map(r => r.id));
                     if (member) return true; else return false
                 });
                 await Promise.allSettled(guilds);
 
                 const newUser = {
                     ID: id,
                     username: guilds.first()?.members.cache.get(id)?.user.username || "unknown",
                     cakeday: "opt-out",
                     currentXp: 0,
                     totalXp: 0,
                 }
                 const sql = `INSERT INTO \`User\` (\`ID\`, \`username\`, \`cakeday\`, \`currentXp\`, \`totalXp\`,) VALUES (${con.escape(newUser.ID)}, ${con.escape(newUser.username)}, ${con.escape(newUser.cakeday)}, ${con.escape(newUser.currentXp)}, ${con.escape(newUser.totalXp)})`;
                 con.query(sql, function (error, result) {
                     if (error) throw (error);
                 });
                 let dbGuilds = [];
                 guilds.forEach(
 
                 )
 
             } else throw new Error(`${id} is not a valid snowflake`)
 
         } */
    },

    Guild: {
        async get(snowflake: Snowflake): Promise<DbDiscordGuild | null> {
            if (!assertIsSnowflake(snowflake)) throw new Error(snowflake + " is not a snowflake, I can't get that guild")
            return new Promise((fulfill, reject) => {
                con.query("SELECT * FROM DiscordGuild WHERE id=" + con.escape(snowflake), function (error, result) {
                    if (!result || result == undefined) {
                        reject("No user with that ID was found")
                    } else {
                        let guild = JSON.parse(JSON.stringify(result))[0];
                        if (!guild || guild == undefined) fulfill(null);
                        else {

                            let parsedGuild: DbDiscordGuildOptions = {
                                id: snowflake,
                                name: result.name,
                                wikiLink: result.wikiLink || "",
                                welcome: {
                                    string: result.welcomeString,
                                    type: result.welcomeType,
                                    title: result.welcomeTitle,
                                    image: result.welcomeImage,
                                    expiration: result.welcomeExpiration
                                },
                                channels: {
                                    questionQueue: result.questionQueueChannel,
                                    publicCommands: result.publicCommandsChannel,
                                    questionDiscussion: result.questionDiscussionChannel,
                                    adminCommands: result.adminCommandsChannel,
                                    faq: result.faqChannel,
                                    general: result.generalChannel,
                                    introductions: result.introductionsChannel,
                                    modRequests: result.modRequestsChannel,
                                    roles: result.rolesChannel,
                                    rules: result.rulesChannel,
                                    secret: result.secretChannel,
                                    spoilerPolicy: result.spoilerPolicyChannel
                                },
                                emoji: [],
                                faq: [],
                                roles: Discord.Collection<Snowflake, DbGuildRole>,
                                links: [],
                                authors: Discord.Collection<Snowflake, DbGuildAuthor>,
                            }

                            if (error) reject(error);
                            else fulfill(new DbUser(guild));
                        }
                    }

                });
            });



        },
        new: async (id: Snowflake): Promise<DbDiscordGuild> => {
            if (!client) throw new Error("Client must be registered before attempting to make guilds!")
            if (assertIsSnowflake(id)) {
                let existing = await DataBase.Guild.get(id);
                if (existing instanceof DbUser) return existing;
                let guildInstance = await client.guilds.fetch(id);
                if (!guildInstance) throw new Error("I'm not in the Guild " + id)

                const sql = `INSERT INTO \`DiscordGuild\` (\`id\`, \`name\`) VALUES (${con.escape(id), con.escape(guildInstance.name)})`;
                con.query(sql, function (error, result) {
                    if (error) throw (error);
                    return DataBase.Guild.get(id);
                });

                return DataBase.Guild.get(id) as Promise<DbDiscordGuild>;

            } else throw new Error(`${id} is not a valid snowflake`)

        },
        /**
         * Initiates the database connection
         * @param {IChironClient} client 
         * @returns 
         */
        init: (baseClient: IChironClient) => {
            client = baseClient;
            if (!hasBeenInitialized) {
                con.connect(function (err: Error) {
                    if (err && (!err.message.indexOf("Cannot enqueue Handshake after already enqueuing a Handshake") as unknown as number > -1)) throw err;
                    console.log("Connected to DataBase!");
                })
                hasBeenInitialized = true;
            }
            return con;
        }

    }


}
//User Database Object Types ------------------------------------------------------
export interface DbUserUpdateOptions {
    id: Snowflake;
    username?: string;
    cakeday?: string;
    currentXp?: number;
    totalXp?: number;
}

export interface DbUserOptions {
    id: Snowflake;
    username: string;
    cakeday: string;
    currentXp: number;
    totalXp: number;
    roles: Snowflake[];
    guilds: Snowflake[];
}

export class DbUser {
    id: Snowflake;
    username: string;
    cakeday: string;
    currentXp: number;
    totalXp: number;
    roles: Snowflake[];
    guilds: Snowflake[];
    constructor(options: DbUserOptions) {
        this.id = options.id;
        this.username = options.username;
        this.cakeday = options.username;
        this.currentXp = options.currentXp;
        this.totalXp = options.totalXp;
        this.roles = options.roles;
        this.guilds = options.guilds;
    }

}


//Guild Database Object Sub-Types ------------------------------------------------------
export enum welcomeTypes {
    prepend,
    embed,
    append,
    insert,
    override,
    disabled
}

export enum DbEmojiTypes {
    none,
    upvote,
    unvote,
    bot,
    confirm,
    deny,
}

export interface DbGuildEmojiOptions {
    emoji: string;
    type?: DbEmojiTypes
}

export class DbGuildEmoji {
    emoji: string;
    type: DbEmojiTypes;
    constructor(options: DbGuildEmojiOptions) {
        this.emoji = options.emoji;
        this.type = options.type || DbEmojiTypes.none
    }

}

export interface DbFaqQuestionOptions {
    question: string,
    answer: string
}

export class DbFaqQuestion {
    question: string;
    answer: string;
    constructor(options: DbFaqQuestionOptions) {
        this.question = options.question;
        this.answer = options.answer;
    }
}

export interface DbFaqCategoryOptions {
    questions: Array<DbFaqQuestion>;
    messageId?: Snowflake;
    name: string;
    expiration?: Date;
}

export class DbFaqCategory {
    questions: Array<DbFaqQuestion>;
    messageId?: Snowflake;
    name: string;
    expiration?: Date;
    constructor(options: DbFaqCategoryOptions) {
        this.questions = options.questions;
        this.name = options.name;
        this.messageId = options.messageId
        this.expiration = options.expiration
    }

}

export class DbGuildLink {
    link: string;
    label: string;
    isMeme: boolean;
    constructor(optionLink: string, optionLabel: string, optionIsMeme?: boolean) {
        this.link = optionLink;
        this.label = optionLabel;
        this.isMeme = optionIsMeme ? optionIsMeme : false;

    }
}

//guild types

export interface DbDiscordGuildOptions {
    id: Snowflake;
    name: string;
    wikiLink: string;
    welcome?: {
        string: string,
        type: welcomeTypes,
        title: string,
        image: string,
        expiration?: Date,
    },
    channels: {
        questionQueue: Snowflake,
        publicCommands: Snowflake,
        questionDiscussion: Snowflake,
        adminCommands: Snowflake,
        faq: Snowflake,
        general: Snowflake,
        introductions: Snowflake,
        modRequests: Snowflake,
        roles: Snowflake,
        rules: Snowflake,
        secret: Snowflake,
        spoilerPolicy: Snowflake
    },
    emoji: Array<DbGuildEmoji>;
    faq: Array<DbFaqCategory>;
    roles: Discord.Collection<Snowflake, DbGuildRole>;
    links: Array<DbGuildLink>;
    authors: Discord.Collection<Snowflake, DbGuildAuthor>;
}

export class DbDiscordGuild {
    id: Snowflake;
    name: string;
    wikiLink?: string;
    welcome: {
        string: string,
        type: welcomeTypes,
        title: string,
        image: string,
        expiration?: Date,
    };
    channels: {
        questionQueue?: Snowflake,
        publicCommands?: Snowflake,
        questionDiscussion?: Snowflake,
        adminCommands?: Snowflake,
        faq?: Snowflake,
        general?: Snowflake,
        introductions?: Snowflake,
        modRequests?: Snowflake,
        roles?: Snowflake,
        rules?: Snowflake,
        secret?: Snowflake,
        spoilerPolicy?: Snowflake
    };
    emoji: Array<DbGuildEmoji>;
    faq: Array<DbFaqCategory>;
    roles: Discord.Collection<Snowflake, DbGuildRole>;
    links: Array<DbGuildLink>;
    authors: Discord.Collection<Snowflake, DbGuildAuthor>;
    constructor(options: DbDiscordGuildOptions) {
        this.id = options.id;
        this.name = options.name;
        this.wikiLink = options.wikiLink;
        if (options.welcome) this.welcome = options.welcome;
        else this.welcome = {
            string: "",
            type: welcomeTypes.disabled,
            image: "",
            expiration: undefined
        }
        this.channels = options.channels;
        this.emoji = options.emoji;
        this.faq = options.faq;
        this.roles = options.roles;
        this.links = options.links;
        this.authors = options.authors;
    }
}

//Guild Role types
export interface DbGuildRoleOptions {
    role: Snowflake;
    duties: Array<DiscordRoleDuties>
}

export class DbGuildRole {
    role: Snowflake;
    duties: Array<DiscordRoleDuties>
    constructor(options: DbGuildRoleOptions) {
        this.role = options.role;
        this.duties = options.duties;
    }

}

export enum DiscordRoleDuties {
    none,
    botTeam,
    cakeday,
    communityGuide,
    helper,
    holiday,
    larper,
    moderator,
    worldmaker,
    botUpdates,
    metaUpdates,
    TTRPGUpdates,
    bookUpdates,
    blogUpdates,
    allUpdates,
    roleplayingUpdates,
    admin,
    isStaff,
    hasRestrictedData,
}

//Guild Author Types
export class DbGuildAuthorLinks {
    label: string;
    link: string;
    constructor(optionLable: string, optionLink: string) {
        this.label = optionLable;
        this.link = optionLink;
    }
}


export interface GuildAuthorOptions {
    discordUserId: Snowflake;
    name: string;
    hexColor: Discord.ColorResolvable;
    blogApiUrl: string;
    blogChannelId: string;
    blogEnabled: boolean;
    answerChannelId: Snowflake;
    imageUrl: string;
    links: Array<DbGuildAuthorLinks>
}



export class DbGuildAuthor {
    discordUserId: Snowflake;
    name: string;
    hexColor: Discord.ColorResolvable;
    blogApiUrl: string;
    blogChannelId: string;
    blogEnabled: boolean;
    answerChannelId: Snowflake;
    imageUrl: string;
    links: Array<DbGuildAuthorLinks>
    constructor(options: GuildAuthorOptions) {
        this.discordUserId = options.discordUserId;
        this.name = options.name;
        this.hexColor = options.hexColor;
        this.blogApiUrl = options.blogApiUrl;
        this.blogChannelId = options.blogChannelId;
        this.blogEnabled = options.blogEnabled;
        this.answerChannelId = options.answerChannelId;
        this.imageUrl = options.imageUrl;
        this.links = options.links;
    }
}


//Question types
export enum DbQuestionStatuses {
    Discarded, Answered, Queued
}

export enum DbQuestionFlag {
    unansweredButTranfered,
    RAFOed
}

export interface DbQuestionOptions {
    id: number;
    messageId: Snowflake;
    status: DbQuestionStatuses;
    questionText: string;
    answerText: string;
    voters: Array<Snowflake>;
    editors: Array<Snowflake>;
    asker: Snowflake;
    answerer: Snowflake;
    flags: Array<DbQuestionFlag>;
    timestamp: Date;
}

export class DbQusetion {
    id: number;
    messageId: Snowflake;
    status: DbQuestionStatuses;
    questionText: string;
    answerText: string = "";
    voters: Array<Snowflake>;
    editors: Array<Snowflake>;
    asker: Snowflake;
    answerer: Snowflake;
    flags: Array<DbQuestionFlag>;
    timestamp: Date;
    constructor(options: DbQuestionOptions) {
        this.id = options.id;
        this.messageId = options.messageId;
        this.status = options.status;
        this.questionText = options.questionText;
        this.voters = options.voters;
        this.editors = options.editors;
        this.asker = options.asker;
        this.answerer = options.answerer;
        this.flags = options.flags;
        this.timestamp = options.timestamp;
    }

}