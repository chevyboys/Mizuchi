require('@sapphire/plugin-editable-commands/register');
require('@sapphire/plugin-logger/register');
const { SapphireClient } = require('@sapphire/framework');
const config = require("../config/config.json")
const U = require("./utilities/General")
const snowflakes = require("../config/snowflakes.json")

//handle intercepting logs:
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, callback) => {
    if (typeof chunk === 'string') {
        U.log(chunk)
    }
    return originalStdoutWrite(chunk, encoding, callback);
};
//handle intercepting errors
const originalStdErr = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, encoding, callback) => {
    if (typeof chunk === 'string') {
        U.errorHandler({error: chunk, fromConsole:true})
    }

    return originalStdErr(chunk, encoding, callback);
}

//register the client
const client = new SapphireClient({
    intents: ['GUILDS', 'GUILD_MESSAGES'],
    defaultPrefix: config.prefix,
    disableMentionPrefix: true,
    loadDefaultErrorListeners: true,
    caseInsensitiveCommands: true,
    caseInsensitivePrefixes: true,
});
let start = async () => {
    await client.login(config.Tokens.primary);
    await client.guilds.fetch(snowflakes.guilds.PrimaryServer);
    U.client = client;
}
start()

process.on("unhandledRejection", (error, p) => p.catch(e => U.errorHandler(e, "Unhandled Rejection")));
process.on("uncaughtException", (error) => U.errorHandler(error, "Uncaught Exception"));