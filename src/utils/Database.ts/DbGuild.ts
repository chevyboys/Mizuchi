import { Guild as PGuild, Guild_welcomeType } from "@prisma/client";
import { Guild, Snowflake } from "discord.js";
class DbGuild {
    id: Snowflake;
    name: string | null = null;
    wikiLink: string | null = null;
    welcome: DbGuildWelcome;
    
    questionQueueChannel: string | null = null;
    publicCommandsChannel: string | null = null;
    questionDiscussionChannel: string | null = null;
    adminCommandsChannel: string | null = null;
    faqChannel: string | null = null;
    generalChannel: string | null = null;
    introductionsChannel: string | null = null;
    modRequestsChannel: string | null = null;
    rolesChannel: string | null = null;
    rulesChannel: string | null = null;
    secretChannel: string | null = null;
    spoilerPolicyChannel: string | null = null;
    constructor(_guild: Guild | PGuild ) {
        this.id = _guild.id;
        this.name = _guild.name;
        this.welcome = new DbGuildWelcome(_guild);
    }
    
    static get(id:Snowflake){
        
    }
}

class DbGuildWelcome{
    string: string | null = null;
    type: Guild_welcomeType = "disabled";
    title: string | null = null;
    image: string | null = null;
    expiration: Date | null = null;
    constructor(_guild: PGuild | Guild | null ){
        if( (<PGuild>_guild).welcomeString != undefined){
            this.string = (<PGuild>_guild).welcomeString || null;
            this.type = (<PGuild>_guild).welcomeType || "disabled";
            this.title = (<PGuild>_guild).welcomeTitle || null;
            this.image = (<PGuild>_guild).welcomeImage || null;
            this.expiration = (<PGuild>_guild).welcomeExpiration || null;
        } 
    }
}