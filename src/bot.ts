import { ChironConfig, ChironClient } from "chironbot";
import { IChironClientOptions } from "chironbot/dist/Headers/Client";
import { Partials, GatewayIntentBits } from "discord.js";
let configOptions;
import('./config/config')
  .then((module) => {
    configOptions = module.configOptions;
  })
  .catch((error) => {
    configOptions = {
    adminIds: [process.env.DISCORD_USER_SNOWFLAKE],
    database: {},
    repo: new URL("https://github.com/chevyboys/Mizuchi/"),
    token: process.env.TEST_BOT ,
    adminServer: process.env.DISCORD_ADMIN_GUILD_SNOWFLAKE,
    DEBUG: true
}; 
  });

const config = new ChironConfig(configOptions)
export let clientOptions = {
    config: config,
    color: "#35a19c",
    modulePath: "dist/modules",
    partials: [Partials.User, Partials.Message, Partials.Reaction],
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    database: config.database
}

const client = new ChironClient(clientOptions as IChironClientOptions);
await client.login(config.token);

client.modules.register();
