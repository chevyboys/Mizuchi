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
    constructor(_guild: Guild | PGuild ){
        
    }
}