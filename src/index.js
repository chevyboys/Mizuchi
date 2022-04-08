require('@sapphire/plugin-editable-commands/register');
const { SapphireClient } = require('@sapphire/framework');
const config = require("../config/config.json")

const client = new SapphireClient({
     intents: ['GUILDS', 'GUILD_MESSAGES'],
     defaultPrefix: config.prefix,
    });

client.login(config.Tokens.primary);
console.log("Login Successful");