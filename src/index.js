require('@sapphire/plugin-editable-commands/register');
const { SapphireClient } = require('@sapphire/framework');
const config = require("../config/config.json")
const U = require("./utilities/General")

const client = new SapphireClient({
     intents: ['GUILDS', 'GUILD_MESSAGES'],
     defaultPrefix: config.prefix,
    });

client.login(config.Tokens.primary);
U.client = client;
console.log("Login Successful");