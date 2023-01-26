import { GatewayIntentBits, Client, Events } from "discord.js";
import { roleConfigOptions } from "../config/config";
import { utils } from "./Utils.Generic";
import { configOptions as config } from "../config/config";
import { clientOptions } from "../bot";
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});
await client.login(roleConfigOptions.token);
client.on(Events.Error, async (error) => {
    const guild = await rolesClient.guilds.fetch(config.adminServer);
    let stack = error.stack ? error.stack : error.toString();
    if (stack.indexOf("DiscordAPIError: Missing Permissions") > -1) {
        let embed = utils.embed({
            title: `I couldn't set a role for someone!`,
            description: `I don't have permission to set the roles for someone. Please set that for them on my behalf.`,
            timestamp: new Date().toISOString(),
            footer: {
                text: `Role set Permission Denied`,
            },
        }).setColor(clientOptions.color);
        guild.channels.cache.get(snowflakes.channels.modRequests).send({ content: `<@&${snowflakes.roles.Moderator}>`, embeds: [embed], allowedMentions: { roles: [snowflakes.roles.Moderator] } });
    }
});
export const rolesClient = client;
process.on("unhandledRejection", (error, p) => p.catch(e => u.errorHandler(e, "Unhandled Rejection")));
process.on("uncaughtException", (error) => u.errorHandler(error, "Uncaught Exception"));
