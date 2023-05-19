import { prismaClient as prisma } from "./prismaClient";
import * as Discord from "discord.js";
export class DbGuild {
    id;
    name = null;
    wikiLink = null;
    welcome;
    channels;
    faqs;
    emoji;
    links;
    roles;
    users;
    authors;
    features;
    constructor(_guild) {
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
            if (thisGuildAuthors)
                for (let i = 0; i < thisGuildAuthors.length; i++) {
                    if (thisGuildAuthors[i])
                        this.authors.push(new DbGuildAuthor(thisGuildAuthors[i]));
                }
        }
    }
    static get(id) {
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
        });
    }
    ;
    static async create(guild) {
        if (guild == null)
            throw new Error("Guild is null");
        if (guild.id == null)
            throw new Error("Guild id is null");
        if (guild.name == null)
            throw new Error("Guild name is null");
        if (guild.channels == null)
            throw new Error("Guild channels is null");
        let guildExisting = await DbGuild.get(guild.id);
        if (guildExisting)
            return guildExisting;
        else
            return prisma.guild.create({
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
            });
    }
    static delete(id) {
    }
    setWelcome(welcome) {
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
    async setChannels(channels) {
        let channelsToSet = {};
        for (const key in this.channels) {
            if (Object.prototype.hasOwnProperty.call(this.channels, key) && typeof this.channels[key] !== "function") {
                const element = channels[key];
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
    setFaqs(faqs) {
        let faqCategories = {};
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
    setEmoji(emoji) {
    }
    setLinks(links) {
    }
    setRoles(roles) {
    }
    setUsers(users) {
    }
}
export class DbGuildAuthor {
    name;
    discordUserId;
    hexColor;
    answerChannelId;
    imageUrl;
    blog;
    links;
    constructor(_Guildauthor) {
        this.name = _Guildauthor.Author.authorName;
        this.discordUserId = _Guildauthor.Author.userId;
        this.hexColor = _Guildauthor.Author.authorHexColor;
        this.imageUrl = _Guildauthor.Author.imageUrl;
        this.answerChannelId = _Guildauthor.answerChannelId;
        this.blog = {
            channelId: _Guildauthor.blogChannelId,
            enabled: _Guildauthor.blogEnabled,
            apiUrl: _Guildauthor.Author.blogApiUrl,
        };
        this.links = _Guildauthor.Author.AuthorLinks;
    }
}
export class DbGuildChannels {
    questionQueue = null;
    publicCommands = null;
    questionDiscussion = null;
    adminCommands = null;
    faq = null;
    general = null;
    introductions = null;
    modRequests = null;
    roles = null;
    rules = null;
    secret = null;
    spoilerPolicy = null;
    constructor(_guild) {
        this.questionQueue = _guild?.questionQueueChannel || null;
        this.publicCommands = _guild?.publicCommandsChannel || null;
        this.questionDiscussion = _guild?.questionDiscussionChannel || null;
        this.adminCommands = _guild?.adminCommandsChannel || null;
        this.faq = _guild?.faqChannel || null;
        this.general = _guild?.generalChannel || null;
        this.introductions = _guild?.introductionsChannel || null;
        this.modRequests = _guild?.modRequestsChannel || null;
        this.roles = _guild?.rolesChannel || null;
        this.rules = _guild?.rulesChannel || null;
        this.secret = _guild?.secretChannel || null;
        this.spoilerPolicy = _guild?.spoilerPolicyChannel || null;
    }
    toString() {
        let string = "";
        for (const key in this) {
            if (Object.prototype.hasOwnProperty.call(this, key)) {
                const element = this[key];
                if (element != null) {
                    string += key + ": <#" + element + ">\n";
                }
            }
        }
        return string;
    }
}
export class DbGuildWelcome {
    string = null;
    type = "disabled";
    title = null;
    image = null;
    expiration = null;
    constructor(_guild) {
        if (_guild.welcomeString != undefined) {
            this.string = _guild.welcomeString || null;
            this.type = _guild.welcomeType || "disabled";
            this.title = _guild.welcomeTitle || null;
            this.image = _guild.welcomeImage || null;
            this.expiration = _guild.welcomeExpiration || null;
        }
    }
}
