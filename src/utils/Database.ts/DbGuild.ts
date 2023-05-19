import { Guild, Guild_welcomeType, FAQCategory, GuildEmoji, GuildLinks, GuildRoleTypeRelationship, User, UserGuildRelationship, AuthorGuildRelationship, Author, AuthorLinks, FAQQuestion, EmojiDuty, RoleDuty } from "@prisma/client";
import { prismaClient as prisma } from "./prismaClient";
import { Snowflake } from "discord.js";

type DbGuildConstructorObject = (Guild & {
    GuildLinks: GuildLinks[];
    AuthorGuildRelationship: (AuthorGuildRelationship & {
        Author: Author & {
            AuthorLinks: AuthorLinks[];
        };
    })[];
    FAQCategory: (FAQCategory & {
        FAQQuestion: FAQQuestion[];
    })[];
    GuildEmoji: (GuildEmoji & {
        EmojiDuty: EmojiDuty | null;
    })[];
    GuildRoleTypeRelationship: (GuildRoleTypeRelationship & {
        RoleDuty: RoleDuty | null;
    })[];
    UserGuildRelationship: (UserGuildRelationship & {
        User: User;
    })[];
});

export class DbGuild {
    id: Snowflake;
    name: string | null = null;
    wikiLink: string | null = null;
    welcome: DbGuildWelcome;
    channels: DbGuildChannels;
    faqs: Promise<FAQCategory[]> | FAQCategory[];
    emoji: Promise<GuildEmoji[]> | GuildEmoji[];
    links: Promise<GuildLinks[]> | GuildLinks[];
    roles: Promise<GuildRoleTypeRelationship[]> | GuildRoleTypeRelationship[];
    users: Promise<UserGuildRelationship[]> | UserGuildRelationship[];
    authors: DbGuildAuthor[];

    constructor(_guild: DbGuildConstructorObject) {
        this.id = _guild.id;
        this.name = _guild.name;
        this.welcome = new DbGuildWelcome(_guild);
        this.channels = new DbGuildChannels(_guild);
        this.faqs = _guild.FAQCategory;
        this.emoji = _guild.GuildEmoji;
        this.links = _guild.GuildLinks;
        this.roles = _guild.GuildRoleTypeRelationship;
        this.users = _guild.UserGuildRelationship;
        this.authors = [];
        let thisGuildAuthors = _guild.AuthorGuildRelationship;
        for (let i = 0; i < thisGuildAuthors.length; i++) {

            this.authors.push(new DbGuildAuthor(thisGuildAuthors[i]));
        }
    }


    static get(id: Snowflake) {
        new Promise<DbGuild>((resolve, reject) => {
            let record = prisma.guild.findUnique({
                where: {
                    id: id,
                },
                include: {
                    FAQCategory: {
                        include: {
                            FAQQuestion: true,
                        }
                    },
                    GuildEmoji: {
                        include: {
                            EmojiDuty: true,
                        }
                    },
                    GuildLinks: true,
                    GuildRoleTypeRelationship: {
                        include: {
                            RoleDuty: true,
                        }
                    },
                    UserGuildRelationship: {
                        include: {
                            User: true,
                        }
                    },
                    AuthorGuildRelationship: {
                        include: {
                            Author: {
                                include: {
                                    AuthorLinks: true,
                                }
                            }
                        },
                    }
                }
            });
            if (record == null) reject("No record found");
            else resolve(new DbGuild(record as unknown as  DbGuildConstructorObject));
        })
            .then((record) => {
                return record;
            });
    };
}


class DbGuildAuthor {

    name: string;
    discordUserId: string;
    hexColor: string;
    answerChannelId: string | null;
    imageUrl: string;
    blog: {
        channelId: string | null;
        enabled: boolean;
        apiUrl: string | null;
    }
    links: AuthorLinks[];

    constructor(_Guildauthor: (AuthorGuildRelationship & { Author: (Author & { AuthorLinks: AuthorLinks[] }) })) {
        this.name = _Guildauthor.Author.authorName;
        this.discordUserId = _Guildauthor.Author.userId;
        this.hexColor = _Guildauthor.Author.authorHexColor;
        this.imageUrl = _Guildauthor.Author.imageUrl;
        this.answerChannelId = _Guildauthor.answerChannelId;
        this.blog = {
            channelId: _Guildauthor.blogChannelId,
            enabled: _Guildauthor.blogEnabled,
            apiUrl: _Guildauthor.Author.blogApiUrl,
        }
        this.links = _Guildauthor.Author.AuthorLinks;
    }

}

class DbGuildChannels {
    questionQueue: string | null = null;
    publicCommands: string | null = null;
    questionDiscussion: string | null = null;
    adminCommands: string | null = null;
    faq: string | null = null;
    general: string | null = null;
    introductions: string | null = null;
    modRequests: string | null = null;
    roles: string | null = null;
    rules: string | null = null;
    secret: string | null = null;
    spoilerPolicy: string | null = null;
    constructor(_guild: DbGuildConstructorObject) {
        this.questionQueue = (<Guild>_guild).questionQueueChannel || null;
        this.publicCommands = (<Guild>_guild).publicCommandsChannel || null;
        this.questionDiscussion = (<Guild>_guild).questionDiscussionChannel || null;
        this.adminCommands = (<Guild>_guild).adminCommandsChannel || null;
        this.faq = (<Guild>_guild).faqChannel || null;
        this.general = (<Guild>_guild).generalChannel || null;
        this.introductions = (<Guild>_guild).introductionsChannel || null;
        this.modRequests = (<Guild>_guild).modRequestsChannel || null;
        this.roles = (<Guild>_guild).rolesChannel || null;
        this.rules = (<Guild>_guild).rulesChannel || null;
        this.secret = (<Guild>_guild).secretChannel || null;
        this.spoilerPolicy = (<Guild>_guild).spoilerPolicyChannel || null;
    }
}

class DbGuildWelcome {
    string: string | null = null;
    type: Guild_welcomeType = "disabled";
    title: string | null = null;
    image: string | null = null;
    expiration: Date | null = null;
    constructor(_guild: DbGuildConstructorObject) {
        if ((<Guild>_guild).welcomeString != undefined) {
            this.string = (<Guild>_guild).welcomeString || null;
            this.type = (<Guild>_guild).welcomeType || "disabled";
            this.title = (<Guild>_guild).welcomeTitle || null;
            this.image = (<Guild>_guild).welcomeImage || null;
            this.expiration = (<Guild>_guild).welcomeExpiration || null;
        }
    }
}

