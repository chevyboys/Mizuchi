import * as Discord from "discord.js";
import { configOptions as config } from "../config/config";
const errorLog = new Discord.WebhookClient(config.webhooks.find(webhook => webhook.name == "error"));
export const utils = {
    /**
     * After the given amount of time, attempts to delete the message.
     * @param {Discord.Message|Discord.Interaction} msg The message to delete.
     * @param {number} t The length of time to wait before deletion, in milliseconds.
     */
    clean: async function (msg, t = 20000) {
        await utils.wait(t);
        if (msg instanceof Discord.CommandInteraction) {
            msg.deleteReply().catch(utils.noop);
        }
        else if ((msg instanceof Discord.Message) && (msg.deletable)) {
            msg.delete().catch(utils.noop);
        }
        return Promise.resolve(msg);
    },
    /**
     * Returns a MessageEmbed with basic values preset, such as color and timestamp.
     * @param {any} data The data object to pass to the MessageEmbed constructor.
     * @param {boolean} [suppressTimeStamp = false]
     *   You can override the color and timestamp here as well.
     */
    embed: function (data, suppressTimeStamp) {
        if (data?.author instanceof Discord.GuildMember) {
            data.author = {
                name: data.author.displayName,
                iconURL: data.author.user.displayAvatarURL()
            };
        }
        else if (data?.author instanceof Discord.User) {
            data.author = {
                name: data.author.username,
                iconURL: data.author.displayAvatarURL()
            };
        }
        const embed = new Discord.EmbedBuilder(data);
        if (!data?.color)
            embed.setColor(config.color);
        if (!data?.timestamp && !suppressTimeStamp)
            embed.setTimestamp();
        return embed;
    },
};
