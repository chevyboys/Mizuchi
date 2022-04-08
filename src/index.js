require('@sapphire/plugin-editable-commands/register');
const { SapphireClient } = require('@sapphire/framework');
const config = require("../config/config.json")

const client = new SapphireClient({
     intents: ['GUILDS', 'GUILD_MESSAGES'],
     defaultPrefix: "!",
     defaultCooldown: {
        delay: 10_000,
        filteredUsers: config.adminId,
        limit: 4,   
      }
    });

client.login(config.Tokens.primary);
console.log("logged in");