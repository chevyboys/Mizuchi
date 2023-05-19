import { Guild, Guild_welcomeType, GuildFeatureRelationship, FAQCategory, GuildEmoji, GuildLinks, GuildRoleTypeRelationship, User, UserGuildRelationship, AuthorGuildRelationship, Author, AuthorLinks, FAQQuestion, EmojiDuty, RoleDuty } from "@prisma/client";
import { prismaClient as prisma } from "./prismaClient";
import { Snowflake } from "discord.js";
import * as Discord from "discord.js";

export type DbGuildConstructorObject = (Guild & {
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
    GuildFeatureRelationship: GuildFeatureRelationship[];
});

export class DbGuild {
    id: Snowflake;
    name: string | null = null;
    wikiLink: string | null = null;
    welcome: DbGuildWelcome;
    channels: DbGuildChannels;
    faqs: FAQCategory[];
    emoji: GuildEmoji[];
    links: GuildLinks[];
    roles: GuildRoleTypeRelationship[];
    users: UserGuildRelationship[];
    authors: DbGuildAuthor[];
    features: GuildFeatureRelationship[];

    constructor(_guild: DbGuildConstructorObject | DbGuild) {
        if (_guild instanceof DbGuild) {
            this.id = _guild.id;
            this.name = _guild.name;
            this.welcome = _guild.welcome;
            this.channels = _guild.channels;
            this.faqs = _guild.faqs;
            this.emoji = _guild.emoji;
            this.links = _guild.links;
            this.roles = _guild.roles;
            this.users = _guild.users;
            this.authors = _guild.authors;
            this.features = _guild.features;

        }
        else {
            this.id = _guild.id;
            this.name = _guild.name;
            this.welcome = new DbGuildWelcome(_guild);
            this.channels = new DbGuildChannels(_guild);
            this.faqs = _guild.FAQCategory;
            this.emoji = _guild.GuildEmoji;
            this.links = _guild.GuildLinks;
            this.roles = _guild.GuildRoleTypeRelationship;
            this.users = _guild.UserGuildRelationship;
            this.features = _guild.GuildFeatureRelationship;
            this.authors = [];
            let thisGuildAuthors = _guild.AuthorGuildRelationship;
            if(thisGuildAuthors)
            for (let i = 0; i < thisGuildAuthors.length; i++) {
                if (thisGuildAuthors[i])
                    this.authors.push(new DbGuildAuthor(thisGuildAuthors[i]));
            }
        }
    }


    static get(id: Snowflake) {
        return prisma.guild.findUnique({
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
                    },
                    GuildFeatureRelationship: true,
                }
            }) as unknown as DbGuildConstructorObject | null;
    };

    static async create(guild: Discord.Guild) {
        if (guild == null) throw new Error("Guild is null");
        if (guild.id == null) throw new Error("Guild id is null");
        if (guild.name == null) throw new Error("Guild name is null");
        if (guild.channels == null) throw new Error("Guild channels is null");
        let guildExisting = await DbGuild.get(guild.id);
        if (guildExisting) return guildExisting;
        else return prisma.guild.create({
            data: {
                id: guild.id,
                name: guild.name,
                faqChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "faq" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                generalChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "general" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                introductionsChannel: guild.channels.cache.filter(channel => (channel.name.toLowerCase() == "introductions" || channel.name.toLowerCase() == "welcome") && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                modRequestsChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "mod-requests" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                rolesChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "roles" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                rulesChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "rules" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                secretChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "secret" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                spoilerPolicyChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "spoiler-policy" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                questionQueueChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "question-queue" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                publicCommandsChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "public-commands" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                questionDiscussionChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "question-discussion" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                adminCommandsChannel: guild.channels.cache.filter(channel => channel.name.toLowerCase() == "admin-commands" && channel.type == Discord.ChannelType.GuildText).first()?.id || null,
                welcomeString: null,
                welcomeType: "disabled",
                welcomeTitle: null,
                welcomeImage: null,
                welcomeExpiration: null,
            }
        }) as unknown as DbGuildConstructorObject;
    }

    static delete(id: Snowflake) {
    }

    setWelcome(welcome: DbGuildWelcome) {
        prisma.guild.update({
            where: {
                id: this.id,
            },
            data: {
                welcomeString: welcome.string,
                welcomeType: welcome.type,
                welcomeTitle: welcome.title,
                welcomeImage: welcome.image,
                welcomeExpiration: welcome.expiration,
            },
        });

    }

    async setChannels(channels: DbGuildChannels) {
        let channelsToSet: any = {};
        for (const key in this.channels) {
            if (Object.prototype.hasOwnProperty.call(this.channels, key) && typeof this.channels[key as keyof DbGuildChannels] !== "function") {
                const element = channels[key as keyof DbGuildChannels];
                if (element != null) {
                    this.channels[key] = element;
                    channelsToSet[(key + "Channel")] = element;
                }

            }
        }
        return await prisma.guild.update({
            where: {
                id: this.id,
            },
            data: channelsToSet,
        });
    }

    setFaqs(faqs: (FAQCategory & {
        FAQQuestion: FAQQuestion[];
    })[]) {
        let faqCategories: any = {};
        for (let i = 0; i < faqs.length; i++) {
            const faqCategory = faqs[i];
            faqCategories[faqCategory.name] = {};
            for (let j = 0; j < faqCategory.FAQQuestion.length; j++) {
                const faqQuestion = faqCategory.FAQQuestion[j];
                faqCategories[faqCategory.name][faqQuestion.question] = faqQuestion.answer;
            }
        }
        prisma.guild.update({
            where: {
                id: this.id,
            },
            data: {
                FAQCategory: faqCategories,
            },
        });
    }

    setEmoji(emoji: GuildEmoji[]) {


    }

    setLinks(links: GuildLinks[]) {

    }

    setRoles(roles: GuildRoleTypeRelationship[]) {

    }

    setUsers(users: UserGuildRelationship[]) {

    }
}


export class DbGuildAuthor {

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

export class DbGuildChannels {
    [key: string]: string | null | undefined | (() => string);
    questionQueue?: string | null = null;
    publicCommands?: string | null = null;
    questionDiscussion?: string | null = null;
    adminCommands?: string | null = null;
    faq?: string | null = null;
    general?: string | null = null;
    introductions?: string | null = null;
    modRequests?: string | null = null;
    roles?: string | null = null;
    rules?: string | null = null;
    secret?: string | null = null;
    spoilerPolicy?: string | null = null;
    constructor(_guild?: DbGuildConstructorObject) {
        this.questionQueue = (<Guild>_guild)?.questionQueueChannel || null;
        this.publicCommands = (<Guild>_guild)?.publicCommandsChannel || null;
        this.questionDiscussion = (<Guild>_guild)?.questionDiscussionChannel || null;
        this.adminCommands = (<Guild>_guild)?.adminCommandsChannel || null;
        this.faq = (<Guild>_guild)?.faqChannel || null;
        this.general = (<Guild>_guild)?.generalChannel || null;
        this.introductions = (<Guild>_guild)?.introductionsChannel || null;
        this.modRequests = (<Guild>_guild)?.modRequestsChannel || null;
        this.roles = (<Guild>_guild)?.rolesChannel || null;
        this.rules = (<Guild>_guild)?.rulesChannel || null;
        this.secret = (<Guild>_guild)?.secretChannel || null;
        this.spoilerPolicy = (<Guild>_guild)?.spoilerPolicyChannel || null;
    }
    toString() {
        let string = "";
        for (const key in this) {
            if (Object.prototype.hasOwnProperty.call(this, key)) {
                const element = this[key as keyof DbGuildChannels];
                if (element != null) {
                    string += key + ": <#" + element + ">\n";
                }

            }
        }
        return string;
    }
}

export class DbGuildWelcome {
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

