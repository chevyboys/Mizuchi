import { Collection, Snowflake } from "discord.js";
import { assertIsSnowflake, clientPrimaryInstance, con } from "../DatabaseGeneral";
import { IDbGuildAuthor, IDbGuildAuthorBlog } from "../Interfaces/DbAuthor";
import { DbGuildEmojiDuty, DbGuildRoleDuty, DbGuildWelcomeTypes, IDbFaqQuestion, IDbGuild, IDbGuildChannels, IDbGuildEmoji, IDbGuildFaq, IDbGuildRole, IDbGuildWelcome } from "../Interfaces/DbGuild";
import { IDbLink } from "../Interfaces/DbLink";

export interface IDbGuildOptions {
    id: Snowflake,
    name?: string,
    wikiLink?: string,
    welcome: DbGuildWelcome,
    channels: DbGuildChannels,
    roles: Collection<Snowflake, DbGuildRole>;
    faqs: Collection<string, IDbGuildFaq>;
    links: DbLink[];
    authors: Collection<number, DbGuildAuthor>;
    emoji?: Collection<string, DbGuildEmoji>;


}

interface guildTableQuery {
    id: Snowflake,
    name?: string,
    wikiLink?: string,
    welcomeString?: string,
    welcomeType: DbGuildWelcomeTypes,
    welcomeTitle?: string,
    welcomeImage?: string,
    welcomeExpiration?: Date,
    questionQueueChannel?: Snowflake,
    publicCommandsChannel?: Snowflake,
    questionDiscussionChannel?: Snowflake,
    adminCommandsChannel?: Snowflake,
    faqChannel?: Snowflake,
    generalChannel?: Snowflake,
    introductionsChannel?: Snowflake,
    modRequestsChannel?: Snowflake,
    rolesChannel?: Snowflake,
    rulesChannel?: Snowflake,
    secretChannel?: Snowflake,
    spoilerPolicyChannel?: Snowflake,
};

interface GuildRoleTypeRelationshipQuery {
    discordRoleId: Snowflake,
    sensativeData?: boolean,
    friendlyName?: string
}


interface GuildAddOptions {
    id: Snowflake,
    //name -> extract from guild object
    wikiLink?: string,
    welcomes: GuildWelcomeAddOptions,
    channels?: GuildChannelAddOptions
    roles?: Collection<Snowflake, {
        Duties?: Array<DbGuildRoleDuty>
        SensativeData?: boolean
    }>;
    faqs?: Collection<string, IDbGuildFaq>;
    links: DbLink[];
    authors: Collection<number, DbGuildAuthor>;
    emoji?: Collection<string, DbGuildEmoji>;
}

interface GuildWelcomeAddOptions{

}

interface GuildChannelAddOptions {

}

//Eventually, all of these Setters should also update the database
export class DbGuild implements IDbGuild {
    private _id!: Snowflake;
    public get id(): Snowflake {
        return this._id;
    }
    private set id(value) {
        this._id = value;
    }


    private _name!: string;
    public get name(): string {
        return this._name;
    }
    private set name(value: string) {
        this._name = value;
    }


    private _welcome!: DbGuildWelcome;
    public get welcome(): DbGuildWelcome {
        return this._welcome;
    }
    public set welcome(value: DbGuildWelcome) {
        this._welcome = value;
    }

    private _channels!: DbGuildChannels;
    public get channels(): DbGuildChannels {
        return this._channels;
    }
    public set channels(value: DbGuildChannels) {
        this._channels = value;
    }

    private _roles!: Collection<Snowflake, DbGuildRole>;
    public get roles(): Collection<Snowflake, DbGuildRole> {
        return this._roles;
    }
    public set roles(value: Collection<Snowflake, DbGuildRole>) {
        this._roles = value;
    }

    private _faqs!: Collection<string, IDbGuildFaq>;
    public get faqs(): Collection<string, IDbGuildFaq> {
        return this._faqs;
    }
    public set faqs(value: Collection<string, IDbGuildFaq>) {
        this._faqs = value;
    }

    private _links!: DbLink[];
    public get links(): DbLink[] {
        return this._links;
    }
    public set links(value: DbLink[]) {
        this._links = value;
    }

    private _authors!: Collection<number, DbGuildAuthor>;
    public get authors(): Collection<number, DbGuildAuthor> {
        return this._authors;
    }
    public set authors(value: Collection<number, DbGuildAuthor>) {
        this._authors = value;
    }


    private _wikiLink?: string | undefined;
    public get wikiLink(): string | undefined {
        return this._wikiLink;
    }
    public set wikiLink(value: string | undefined) {
        this._wikiLink = value;
    }


    private _emoji?: Collection<string, DbGuildEmoji> | undefined;
    public get emoji(): Collection<string, DbGuildEmoji> | undefined {
        return this._emoji;
    }
    public set emoji(value: Collection<string, DbGuildEmoji> | undefined) {
        this._emoji = value;
    }

    private constructor(IDbGuildOptions: IDbGuildOptions) {
        this._id = IDbGuildOptions.id;
        this._name = IDbGuildOptions.name || clientPrimaryInstance ? clientPrimaryInstance.guilds.cache.get(IDbGuildOptions.id)?.name || "" : ""
        this._wikiLink = IDbGuildOptions.wikiLink;
        this._welcome = IDbGuildOptions.welcome;
        this._channels = IDbGuildOptions.channels;
        this._roles = IDbGuildOptions.roles;
        this._faqs = IDbGuildOptions.faqs;
        this._links = IDbGuildOptions.links;
        this._authors = IDbGuildOptions.authors;
        this._emoji = IDbGuildOptions.emoji;

    }

    public static async add(optionId: Snowflake) {
        if (!assertIsSnowflake(optionId)) throw new Error(optionId + " is not a valid guildId");
        const client = clientPrimaryInstance;
        const guild = await client.guilds.fetch(optionId);
        if(!guild) throw new Error(optionId + " is not a guildId of a guild I am in");
        
        
    }


    public static async get(optionId: Snowflake): Promise<DbGuild | undefined> {
        if (!assertIsSnowflake(optionId)) throw new Error(optionId + " is not a valid guildId");
        let guildObject = await new Promise((fulfill, reject) => {
            con.query("SELECT * FROM `Guild` WHERE Guild.id = " + con.escape(optionId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No guild with that id was found")
                } else {
                    let guild = result[0];
                    if (!guild || guild == undefined) fulfill(null);
                    else {
                        if (error) reject(error);
                        else fulfill(guild);
                    }
                }

            });
        }) as guildTableQuery | null;
        if (!guildObject) return undefined;

        return new DbGuild({
            id: optionId,
            name: guildObject.name,
            wikiLink: guildObject.wikiLink,
            welcome: new DbGuildWelcome(guildObject),
            channels: new DbGuildChannels(guildObject),
            roles: await DbGuildRole.getAll(optionId),
            faqs: await DbGuildFaq.getAll(optionId),
            links: await DbLink.getAll(optionId),
            authors: await DbGuildAuthor.getAll(optionId),
            emoji: await DbGuildEmoji.getAll(optionId),
        });


    };


    public static setAll() {
        let client = clientPrimaryInstance;
    };

    /*public static getAll(): Collection<Snowflake, DbGuild> {
        //ToDo
        return new Collection
    }*/


}


interface DbGuildWelcomeOptions {
    welcomeTitle?: string;
    welcomeType: DbGuildWelcomeTypes;
    welcomeImage?: string;
    welcomeExpiration?: Date
    welcomeString?: string
}

class DbGuildWelcome implements IDbGuildWelcome {
    private _title?: string | undefined;
    public get title(): string | undefined {
        return this._title;
    }
    public set title(value: string | undefined) {
        this._title = value;
    }


    private _type!: DbGuildWelcomeTypes;
    public get type(): DbGuildWelcomeTypes {
        return this._type;
    }
    public set type(value: DbGuildWelcomeTypes) {
        this._type = value;
    }

    private _image?: string | undefined;
    public get image(): string | undefined {
        return this._image;
    }
    public set image(value: string | undefined) {
        this._image = value;
    }

    private _expiration?: Date | undefined;
    public get expiration(): Date | undefined {
        return this._expiration;
    }
    public set expiration(value: Date | undefined) {
        this._expiration = value;
    }

    private _string?: string | undefined;
    public get string(): string | undefined {
        return this._string;
    }
    public set string(value: string | undefined) {
        this._string = value;
    }

    constructor(options: DbGuildWelcomeOptions) {
        this._title = options.welcomeTitle;
        this._type = options.welcomeType;
        this._image = options.welcomeImage;
        this._expiration = options.welcomeExpiration;
        this._string = options.welcomeString;
    }

}

interface IDbGuildChannelsOptions {
    questionQueueChannel?: Snowflake,
    publicCommandsChannel?: Snowflake,
    questionDiscussionChannel?: Snowflake,
    adminCommandsChannel?: Snowflake,
    faqChannel?: Snowflake,
    generalChannel?: Snowflake,
    introductionChannel?: Snowflake,
    modRequestChannel?: Snowflake,
    rolesChannel?: Snowflake,
    rulesChannel?: Snowflake,
    secretChannel?: Snowflake,
    spoilerPolicyChannel?: Snowflake,
}

class DbGuildChannels implements IDbGuildChannels {
    private _questionQueue?: Snowflake | undefined;
    public get questionQueue(): Snowflake | undefined {
        return this._questionQueue;
    }
    public set questionQueue(value: Snowflake | undefined) {
        this._questionQueue = value;
    }

    private _publicCommands?: Snowflake | undefined;
    public get publicCommands(): Snowflake | undefined {
        return this._publicCommands;
    }
    public set publicCommands(value: Snowflake | undefined) {
        this._publicCommands = value;
    }

    private _questionDiscussion?: Snowflake | undefined;
    public get questionDiscussion(): Snowflake | undefined {
        return this._questionDiscussion;
    }
    public set questionDiscussion(value: Snowflake | undefined) {
        this._questionDiscussion = value;
    }

    private _adminCommands?: Snowflake | undefined;
    public get adminCommands(): Snowflake | undefined {
        return this._adminCommands;
    }
    public set adminCommands(value: Snowflake | undefined) {
        this._adminCommands = value;
    }

    private _faq?: Snowflake | undefined;
    public get faq(): Snowflake | undefined {
        return this._faq;
    }
    public set faq(value: Snowflake | undefined) {
        this._faq = value;
    }

    private _general?: Snowflake | undefined;
    public get general(): Snowflake | undefined {
        return this._general;
    }
    public set general(value: Snowflake | undefined) {
        this._general = value;
    }

    private _introduction?: Snowflake | undefined;
    public get introduction(): Snowflake | undefined {
        return this._introduction;
    }
    public set introduction(value: Snowflake | undefined) {
        this._introduction = value;
    }

    private _modRequest?: Snowflake | undefined;
    public get modRequest(): Snowflake | undefined {
        return this._modRequest;
    }
    public set modRequest(value: Snowflake | undefined) {
        this._modRequest = value;
    }

    private _roles?: Snowflake | undefined;
    public get roles(): Snowflake | undefined {
        return this._roles;
    }
    public set roles(value: Snowflake | undefined) {
        this._roles = value;
    }

    private _rules?: Snowflake | undefined;
    public get rules(): Snowflake | undefined {
        return this._rules;
    }
    public set rules(value: Snowflake | undefined) {
        this._rules = value;
    }

    private _secret?: Snowflake | undefined;
    public get secret(): Snowflake | undefined {
        return this._secret;
    }
    public set secret(value: Snowflake | undefined) {
        this._secret = value;
    }

    private _spoilerPolicy?: Snowflake | undefined;
    public get spoilerPolicy(): Snowflake | undefined {
        return this._spoilerPolicy;
    }
    public set spoilerPolicy(value: Snowflake | undefined) {
        this._spoilerPolicy = value;
    }

    constructor(options: IDbGuildChannelsOptions) {
        this.questionQueue = options.questionQueueChannel;
        this.publicCommands = options.publicCommandsChannel;
        this.questionDiscussion = options.questionDiscussionChannel;
        this.adminCommands = options.adminCommandsChannel;
        this.faq = options.faqChannel;
        this.general = options.generalChannel;
        this.introduction = options.introductionChannel;
        this.modRequest = options.modRequestChannel;
        this.roles = options.rolesChannel;
        this.rules = options.rulesChannel;
        this.secret = options.secretChannel;
        this.spoilerPolicy = options.spoilerPolicyChannel;
    }
}

interface DbGuildRoleOptions {
    id: Snowflake,
    duties: DbGuildRoleDuty[];
    sensativeData?: boolean | undefined;
}

class DbGuildRole implements IDbGuildRole {
    private _id!: Snowflake;
    public get id(): Snowflake {
        return this._id;
    }
    private set id(value: Snowflake) {
        this._id = value;
    }
    duties: DbGuildRoleDuty[];

    private _sensativeData?: boolean | undefined;
    public get sensativeData(): boolean | undefined {
        return this._sensativeData;
    }
    public set sensativeData(value: boolean | undefined) {
        this._sensativeData = value;
    }

    constructor(options: DbGuildRoleOptions) {
        this.id = options.id;
        this.duties = options.duties;
        this.sensativeData = options.sensativeData || false;
    }


    static async getAll(guildId: Snowflake) {
        if (!assertIsSnowflake(guildId)) throw new Error(guildId + " is not a valid guild snowflake")
        let guildRoles = await new Promise((fulfill, reject) => {
            con.query("SELECT `GuildRoleTypeRelationship`.`discordRoleId`, `GuildRoleTypeRelationship`.`sensitiveData`, `RoleDuty`.`friendlyName` FROM `GuildRoleTypeRelationship` LEFT JOIN `RoleDuty` ON `GuildRoleTypeRelationship`.`discordRoleDutyId` = `RoleDuty`.`id` WHERE GuildRoleTypeRelationship.discordGuildId = " + con.escape(guildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No roles for a guild with that id were found")
                } else {
                    let x = result[0];
                    if (!x || x == undefined) fulfill([]);
                    else {
                        if (error) reject(error);
                        else fulfill(result);
                    }
                }

            });
        }) as Array<GuildRoleTypeRelationshipQuery>;

        let parsedGuildRoles = Collection.combineEntries(guildRoles.map((r) => [r.discordRoleId, new DbGuildRole({
            id: r.discordRoleId,
            duties: r.friendlyName ? [DbGuildRoleDuty[r.friendlyName as keyof typeof DbGuildRoleDuty]] : [],
            sensativeData: r.sensativeData || false
        })]), (v1, v2) => {
            v1.duties = v1.duties.concat(v2.duties);
            v1.sensativeData = v1.sensativeData || v2.sensativeData
            return v1
        })
        return parsedGuildRoles;
    }


}

interface DbGuildFaqOptions {
    name: string;
    messageId?: string | undefined;
    expiration?: Date | undefined;
    questions: IDbFaqQuestion[];
}

interface GuildFaqQueryRow {
    messageId?: Snowflake,
    name: string,
    expiration?: Date
    question: string,
    answer: string
}

class DbGuildFaq implements IDbGuildFaq {
    name: string;
    messageId?: string | undefined;
    expiration?: Date | undefined;
    questions: IDbFaqQuestion[];
    constructor(options: DbGuildFaqOptions) {
        this.name = options.name;
        this.messageId = options.messageId;
        this.expiration = options.expiration;
        this.questions = options.questions;
    }

    public static async getAll(guildId: Snowflake) {
        if (!assertIsSnowflake(guildId)) throw new Error(guildId + " is not a valid guild snowflake")
        let guildFaq = await new Promise((fulfill, reject) => {
            con.query("SELECT`FAQCategory`.`messageId`, `FAQCategory`.`name`, `FAQCategory`.`expiration`, `FAQQuestion`.`question`, `FAQQuestion`.`answer` FROM`FAQCategory` LEFT JOIN`FAQQuestion` ON`FAQQuestion`.`FAQCategoryId` = `FAQCategory`.`id` WHERE FAQCategory.guildId = " + con.escape(guildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No FAQ for a guild with that id were found")
                } else {
                    let x = result[0];
                    if (!x || x == undefined) fulfill([]);
                    else {
                        if (error) reject(error);
                        else fulfill(result);
                    }
                }

            });
        }) as Array<GuildFaqQueryRow>;

        let parsedGuildFaq = Collection.combineEntries(guildFaq.map((row) => [row.name, new DbGuildFaq({
            messageId: row.messageId,
            name: row.name,
            questions: [new DbFaqQuestion(row)]
        })]), (v1, v2) => {
            v1.questions = v1.questions.concat(v2.questions);
            return v1;
        })
        return parsedGuildFaq;
    }

}

class DbFaqQuestion implements IDbFaqQuestion {
    question: string;
    answer: string;
    constructor(options: GuildFaqQueryRow) {
        this.question = options.question;
        this.answer = options.answer;
    }
}



interface DbLinkOptions {
    link: string;
    label: string;
    isMeme?: boolean;
}

interface DbGuildLinkRow {
    link: string,
    label: string,
    isMeme: boolean
}

class DbLink implements IDbLink {
    link: string;
    label: string;
    isMeme: boolean;
    constructor(options: DbLinkOptions) {
        this.link = options.link;
        this.label = options.label;
        this.isMeme = options.isMeme || false;
    }
    static async getAll(guildId: Snowflake) {
        if (!assertIsSnowflake(guildId)) throw new Error(guildId + " is not a valid guild snowflake")
        let guildLinkRows = await new Promise((fulfill, reject) => {
            con.query("SELECT `GuildLinks`.`link`, `GuildLinks`.`label`, `GuildLinks`.`isMeme` FROM `GuildLinks` where GuildLinks.discordGuildid = " + con.escape(guildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No links for a guild with that id were found")
                } else {
                    let x = result[0];
                    if (!x || x == undefined) fulfill([]);
                    else {
                        if (error) reject(error);
                        else fulfill(result);
                    }
                }

            });
        }) as Array<DbGuildLinkRow>;

        return guildLinkRows.map(r =>
            new DbLink(r)
        )
    }
}

interface IDbGuildAuthorOptions {
    id: Snowflake;
    name: string;
    color?: string | undefined;
    blog: IDbGuildAuthorBlog;
    answerChannel?: string | undefined;
    imageUrl: string;
    links: IDbLink[];
    guildId: string;
}

interface DbGuildAuthorRow {
    id: number,
    answerChannelId: Snowflake,
    userId: Snowflake,
    authorName: string,
    authorHexColor: string,
    blogApiUrl?: string,
    blogChannelId?: Snowflake,
    imageUrl: string,
    blogEnabled?: boolean,
    label?: string, //link
    link?: string, //link
}

export class DbGuildAuthor implements IDbGuildAuthor {
    id: Snowflake;
    name: string;
    color?: string | undefined;
    blog: IDbGuildAuthorBlog;
    answerChannel?: string | undefined;
    imageUrl: string;
    links: IDbLink[];
    guildId: string;
    constructor(options: IDbGuildAuthorOptions) {
        this.id = options.id;
        this.name = options.name;
        this.color = options.color;
        this.blog = options.blog;
        this.answerChannel = options.answerChannel;
        this.imageUrl = options.imageUrl;
        this.links = options.links;
        this.guildId = options.guildId;
    }

    public static async get(userId: Snowflake, guildId: Snowflake) {
        let authors = await DbGuildAuthor.getAll(guildId)
        return authors.find(r => r.id == userId)
    }

    public static async getAll(optionGuildId: Snowflake) {
        if (!assertIsSnowflake(optionGuildId)) throw new Error(optionGuildId + " is not a valid guild snowflake")
        let guildAuthorRows = await new Promise((fulfill, reject) => {
            con.query("SELECT `Author`.`id`, `Author`.`userId`, `Author`.`authorName`, AuthorGuildRelationship.answerChannelId, `Author`.`authorHexColor`, `Author`.`blogApiUrl`, `AuthorGuildRelationship`.`blogChannelId`, `Author`.`imageUrl`, `AuthorGuildRelationship`.`blogEnabled`, `AuthorLinks`.`label`, `AuthorLinks`.`link` FROM `Author` LEFT JOIN `AuthorGuildRelationship` ON `AuthorGuildRelationship`.`authorId` = `Author`.`id` LEFT JOIN `AuthorLinks` ON `AuthorLinks`.`authorId` = `Author`.`id` where AuthorGuildRelationship.guildid = " + con.escape(optionGuildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No authors for a guild with that id were found")
                } else {
                    let x = result[0];
                    if (!x || x == undefined) fulfill([]);
                    else {
                        if (error) reject(error);
                        else fulfill(result);
                    }
                }

            });
        }) as Array<DbGuildAuthorRow>;

        let GuildAuthors = Collection.combineEntries(guildAuthorRows.map((row) => [row.id, new DbGuildAuthor({
            id: row.userId,
            name: row.authorName,
            color: row.authorHexColor,
            blog: {
                api: row.blogApiUrl,
                channel: row.blogChannelId,
                enabled: row.blogEnabled || false
            },
            answerChannel: row.answerChannelId,
            imageUrl: row.imageUrl,
            links: (row.label && row.link) ? [new DbLink({
                label: row.label,
                link: row.link,
                isMeme: false
            })
            ] : [],
            guildId: optionGuildId

        })]), (v1, v2) => {
            v1.links = v1.links.concat(v2.links);
            v1.blog.enabled = v1.blog.enabled || v2.blog.enabled;
            v1.color = v1.color || v2.color;
            v1.answerChannel = v1.answerChannel || v2.answerChannel;

            return v1;
        })

        return GuildAuthors;
    }

}

interface IDbGuildEmojiOptions {
    emoji: string,
    duty: DbGuildEmojiDuty,
}

interface DbGuildEmojiRow {
    emoji: string,
    duty: DbGuildEmojiDuty,
    default: string
}

class DbGuildEmoji implements IDbGuildEmoji {
    duty: DbGuildEmojiDuty;
    emoji: string;
    constructor(options: IDbGuildEmojiOptions) {
        this.duty = options.duty;
        this.emoji = options.emoji;
    }


    public static async getAll(optionGuildId: Snowflake) {
        if (!assertIsSnowflake(optionGuildId)) throw new Error(optionGuildId + " is not a valid guild snowflake")
        let guildEmojiRows = await new Promise((fulfill, reject) => {
            con.query("SELECT `GuildEmoji`.`emoji`, `EmojiDuty`.`duty`, `EmojiDuty`.`defaultEmoji` FROM`GuildEmoji` RIGHT JOIN`EmojiDuty` ON`GuildEmoji`.`emojiDutyId` = `EmojiDuty`.`id` WHERE GuildEmoji.discordGuildid = " + con.escape(optionGuildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No emoji for a guild with that id were found")
                } else {
                    let x = result[0];
                    if (!x || x == undefined) fulfill([]);
                    else {
                        if (error) reject(error);
                        else fulfill(result);
                    }
                }

            });
        }) as Array<DbGuildEmojiRow>;

        let GuildEmoji = Collection.combineEntries(guildEmojiRows.map((row) => [row.default, new DbGuildEmoji({
            emoji: row.emoji.trim() != "" ? row.emoji : row.default,
            duty: DbGuildEmojiDuty[row.duty as unknown as keyof typeof DbGuildEmojiDuty]

        })]), (v1, v2) => {
            return v1;
        })

        return GuildEmoji;
    }
}