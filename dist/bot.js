import { ChironConfig, ChironClient } from "chironbot";
import { Partials, GatewayIntentBits } from "discord.js";
import { configOptions } from "./config/config";
import * as mysql from "mysql";
const con = mysql.createConnection(configOptions.database.mysql);
con.connect(function (err) {
    if (err && !(err.toString().indexOf("Cannot enqueue Handshake after already enqueuing a Handshake") > -1))
        throw err;
    console.log("Connected to DataBase!");
});
const config = new ChironConfig(configOptions);
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
};
const client = new ChironClient(clientOptions);
await client.login(config.token);
client.modules.register();
