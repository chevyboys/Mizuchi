import { Collection } from "discord.js";
import { assertIsSnowflake, clientPrimaryInstance, con } from "../DatabaseGeneral";
import { DbGuildEmojiDuty, DbGuildRoleDuty } from "../Interfaces/DbGuild";
;
//Eventually, all of these Setters should also update the database
export class DbGuild {
    _id;
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
    }
    _name;
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    _welcome;
    get welcome() {
        return this._welcome;
    }
    set welcome(value) {
        this._welcome = value;
    }
    _channels;
    get channels() {
        return this._channels;
    }
    set channels(value) {
        this._channels = value;
    }
    _roles;
    get roles() {
        return this._roles;
    }
    set roles(value) {
        this._roles = value;
    }
    _faqs;
    get faqs() {
        return this._faqs;
    }
    set faqs(value) {
        this._faqs = value;
    }
    _links;
    get links() {
        return this._links;
    }
    set links(value) {
        this._links = value;
    }
    _authors;
    get authors() {
        return this._authors;
    }
    set authors(value) {
        this._authors = value;
    }
    _wikiLink;
    get wikiLink() {
        return this._wikiLink;
    }
    set wikiLink(value) {
        this._wikiLink = value;
    }
    _emoji;
    get emoji() {
        return this._emoji;
    }
    set emoji(value) {
        this._emoji = value;
    }
    constructor(IDbGuildOptions) {
        this._id = IDbGuildOptions.id;
        this._name = IDbGuildOptions.name || clientPrimaryInstance ? clientPrimaryInstance.guilds.cache.get(IDbGuildOptions.id)?.name || "" : "";
        this._wikiLink = IDbGuildOptions.wikiLink;
        this._welcome = IDbGuildOptions.welcome;
        this._channels = IDbGuildOptions.channels;
        this._roles = IDbGuildOptions.roles;
        this._faqs = IDbGuildOptions.faqs;
        this._links = IDbGuildOptions.links;
        this._authors = IDbGuildOptions.authors;
        this._emoji = IDbGuildOptions.emoji;
    }
    static async add(optionId) {
        if (!assertIsSnowflake(optionId))
            throw new Error(optionId + " is not a valid guildId");
        const client = clientPrimaryInstance;
        const guild = await client.guilds.fetch(optionId);
        if (!guild)
            throw new Error(optionId + " is not a guildId of a guild I am in");
    }
    static async get(optionId) {
        if (!assertIsSnowflake(optionId))
            throw new Error(optionId + " is not a valid guildId");
        let guildObject = await new Promise((fulfill, reject) => {
            con.query("SELECT * FROM `Guild` WHERE Guild.id = " + con.escape(optionId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No guild with that id was found");
                }
                else {
                    let guild = result[0];
                    if (!guild || guild == undefined)
                        fulfill(null);
                    else {
                        if (error)
                            reject(error);
                        else
                            fulfill(guild);
                    }
                }
            });
        });
        if (!guildObject)
            return undefined;
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
    }
    ;
    static setAll() {
        let client = clientPrimaryInstance;
    }
    ;
}
class DbGuildWelcome {
    _title;
    get title() {
        return this._title;
    }
    set title(value) {
        this._title = value;
    }
    _type;
    get type() {
        return this._type;
    }
    set type(value) {
        this._type = value;
    }
    _image;
    get image() {
        return this._image;
    }
    set image(value) {
        this._image = value;
    }
    _expiration;
    get expiration() {
        return this._expiration;
    }
    set expiration(value) {
        this._expiration = value;
    }
    _string;
    get string() {
        return this._string;
    }
    set string(value) {
        this._string = value;
    }
    constructor(options) {
        this._title = options.welcomeTitle;
        this._type = options.welcomeType;
        this._image = options.welcomeImage;
        this._expiration = options.welcomeExpiration;
        this._string = options.welcomeString;
    }
}
class DbGuildChannels {
    _questionQueue;
    get questionQueue() {
        return this._questionQueue;
    }
    set questionQueue(value) {
        this._questionQueue = value;
    }
    _publicCommands;
    get publicCommands() {
        return this._publicCommands;
    }
    set publicCommands(value) {
        this._publicCommands = value;
    }
    _questionDiscussion;
    get questionDiscussion() {
        return this._questionDiscussion;
    }
    set questionDiscussion(value) {
        this._questionDiscussion = value;
    }
    _adminCommands;
    get adminCommands() {
        return this._adminCommands;
    }
    set adminCommands(value) {
        this._adminCommands = value;
    }
    _faq;
    get faq() {
        return this._faq;
    }
    set faq(value) {
        this._faq = value;
    }
    _general;
    get general() {
        return this._general;
    }
    set general(value) {
        this._general = value;
    }
    _introduction;
    get introduction() {
        return this._introduction;
    }
    set introduction(value) {
        this._introduction = value;
    }
    _modRequest;
    get modRequest() {
        return this._modRequest;
    }
    set modRequest(value) {
        this._modRequest = value;
    }
    _roles;
    get roles() {
        return this._roles;
    }
    set roles(value) {
        this._roles = value;
    }
    _rules;
    get rules() {
        return this._rules;
    }
    set rules(value) {
        this._rules = value;
    }
    _secret;
    get secret() {
        return this._secret;
    }
    set secret(value) {
        this._secret = value;
    }
    _spoilerPolicy;
    get spoilerPolicy() {
        return this._spoilerPolicy;
    }
    set spoilerPolicy(value) {
        this._spoilerPolicy = value;
    }
    constructor(options) {
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
class DbGuildRole {
    _id;
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
    }
    duties;
    _sensativeData;
    get sensativeData() {
        return this._sensativeData;
    }
    set sensativeData(value) {
        this._sensativeData = value;
    }
    constructor(options) {
        this.id = options.id;
        this.duties = options.duties;
        this.sensativeData = options.sensativeData || false;
    }
    static async getAll(guildId) {
        if (!assertIsSnowflake(guildId))
            throw new Error(guildId + " is not a valid guild snowflake");
        let guildRoles = await new Promise((fulfill, reject) => {
            con.query("SELECT `GuildRoleTypeRelationship`.`discordRoleId`, `GuildRoleTypeRelationship`.`sensitiveData`, `RoleDuty`.`friendlyName` FROM `GuildRoleTypeRelationship` LEFT JOIN `RoleDuty` ON `GuildRoleTypeRelationship`.`discordRoleDutyId` = `RoleDuty`.`id` WHERE GuildRoleTypeRelationship.discordGuildId = " + con.escape(guildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No roles for a guild with that id were found");
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
        let parsedGuildRoles = Collection.combineEntries(guildRoles.map((r) => [r.discordRoleId, new DbGuildRole({
                id: r.discordRoleId,
                duties: r.friendlyName ? [DbGuildRoleDuty[r.friendlyName]] : [],
                sensativeData: r.sensativeData || false
            })]), (v1, v2) => {
            v1.duties = v1.duties.concat(v2.duties);
            v1.sensativeData = v1.sensativeData || v2.sensativeData;
            return v1;
        });
        return parsedGuildRoles;
    }
}
class DbGuildFaq {
    name;
    messageId;
    expiration;
    questions;
    constructor(options) {
        this.name = options.name;
        this.messageId = options.messageId;
        this.expiration = options.expiration;
        this.questions = options.questions;
    }
    static async getAll(guildId) {
        if (!assertIsSnowflake(guildId))
            throw new Error(guildId + " is not a valid guild snowflake");
        let guildFaq = await new Promise((fulfill, reject) => {
            con.query("SELECT`FAQCategory`.`messageId`, `FAQCategory`.`name`, `FAQCategory`.`expiration`, `FAQQuestion`.`question`, `FAQQuestion`.`answer` FROM`FAQCategory` LEFT JOIN`FAQQuestion` ON`FAQQuestion`.`FAQCategoryId` = `FAQCategory`.`id` WHERE FAQCategory.guildId = " + con.escape(guildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No FAQ for a guild with that id were found");
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
        let parsedGuildFaq = Collection.combineEntries(guildFaq.map((row) => [row.name, new DbGuildFaq({
                messageId: row.messageId,
                name: row.name,
                questions: [new DbFaqQuestion(row)]
            })]), (v1, v2) => {
            v1.questions = v1.questions.concat(v2.questions);
            return v1;
        });
        return parsedGuildFaq;
    }
}
class DbFaqQuestion {
    question;
    answer;
    constructor(options) {
        this.question = options.question;
        this.answer = options.answer;
    }
}
class DbLink {
    link;
    label;
    isMeme;
    constructor(options) {
        this.link = options.link;
        this.label = options.label;
        this.isMeme = options.isMeme || false;
    }
    static async getAll(guildId) {
        if (!assertIsSnowflake(guildId))
            throw new Error(guildId + " is not a valid guild snowflake");
        let guildLinkRows = await new Promise((fulfill, reject) => {
            con.query("SELECT `GuildLinks`.`link`, `GuildLinks`.`label`, `GuildLinks`.`isMeme` FROM `GuildLinks` where GuildLinks.discordGuildid = " + con.escape(guildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No links for a guild with that id were found");
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
        return guildLinkRows.map(r => new DbLink(r));
    }
}
export class DbGuildAuthor {
    id;
    name;
    color;
    blog;
    answerChannel;
    imageUrl;
    links;
    guildId;
    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.color = options.color;
        this.blog = options.blog;
        this.answerChannel = options.answerChannel;
        this.imageUrl = options.imageUrl;
        this.links = options.links;
        this.guildId = options.guildId;
    }
    static async get(userId, guildId) {
        let authors = await DbGuildAuthor.getAll(guildId);
        return authors.find(r => r.id == userId);
    }
    static async getAll(optionGuildId) {
        if (!assertIsSnowflake(optionGuildId))
            throw new Error(optionGuildId + " is not a valid guild snowflake");
        let guildAuthorRows = await new Promise((fulfill, reject) => {
            con.query("SELECT `Author`.`id`, `Author`.`userId`, `Author`.`authorName`, AuthorGuildRelationship.answerChannelId, `Author`.`authorHexColor`, `Author`.`blogApiUrl`, `AuthorGuildRelationship`.`blogChannelId`, `Author`.`imageUrl`, `AuthorGuildRelationship`.`blogEnabled`, `AuthorLinks`.`label`, `AuthorLinks`.`link` FROM `Author` LEFT JOIN `AuthorGuildRelationship` ON `AuthorGuildRelationship`.`authorId` = `Author`.`id` LEFT JOIN `AuthorLinks` ON `AuthorLinks`.`authorId` = `Author`.`id` where AuthorGuildRelationship.guildid = " + con.escape(optionGuildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No authors for a guild with that id were found");
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
        });
        return GuildAuthors;
    }
}
class DbGuildEmoji {
    duty;
    emoji;
    constructor(options) {
        this.duty = options.duty;
        this.emoji = options.emoji;
    }
    static async getAll(optionGuildId) {
        if (!assertIsSnowflake(optionGuildId))
            throw new Error(optionGuildId + " is not a valid guild snowflake");
        let guildEmojiRows = await new Promise((fulfill, reject) => {
            con.query("SELECT `GuildEmoji`.`emoji`, `EmojiDuty`.`duty`, `EmojiDuty`.`defaultEmoji` FROM`GuildEmoji` RIGHT JOIN`EmojiDuty` ON`GuildEmoji`.`emojiDutyId` = `EmojiDuty`.`id` WHERE GuildEmoji.discordGuildid = " + con.escape(optionGuildId) + ";", function (error, result) {
                if (!result || result == undefined) {
                    reject("No emoji for a guild with that id were found");
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
        let GuildEmoji = Collection.combineEntries(guildEmojiRows.map((row) => [row.default, new DbGuildEmoji({
                emoji: row.emoji.trim() != "" ? row.emoji : row.default,
                duty: DbGuildEmojiDuty[row.duty]
            })]), (v1, v2) => {
            return v1;
        });
        return GuildEmoji;
    }
}
