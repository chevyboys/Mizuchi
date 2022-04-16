const Discord = require("discord.js");
const snowflakes = require("../../config/snowflakes.json"),
    config = require("../../config/config.json"),
    errorLog = new Discord.WebhookClient(config.Webhooks.error);

/**
 * @class 
 */
class GeneralUtils {
    /**
     * 
     * @param {Discord.CommandInteraction|Discord.Message} msg the message or interaction to delete
     * @param {number} [t=20]  the number of seconds to wait before cleaning 
     * @returns 
     */
    static async clean(msg, t = 20) {
        await GeneralUtils.wait(t);
        if (msg instanceof Discord.CommandInteraction) {
            msg.deleteReply().catch(GeneralUtils.noop);
        } else if ((msg instanceof Discord.Message) && (msg.deletable)) {
            msg.delete().catch(GeneralUtils.noop);
        }

        return Promise.resolve(msg);
    }
    /**
     * @type {Discord.client} client
     */
    static client;
    static PrimaryServer;
    static color() {
        if (!this.client) return "#000000"
        const guild = GeneralUtils.PrimaryServery || this.client.guilds.cache.get(snowflakes.guilds.PrimaryServer) || this.client.guilds.fetch(snowflakes.guilds.PrimaryServer);
        const botMember = guild.members.cache.get(this.client.user.id) || guild.members.fetch(this.client.user.id)
        return botMember.displayHexColor;
    }
    /**
   * Returns a MessageEmbed with basic values preset, such as color and timestamp.
   * @param {any} data The data object to pass to the MessageEmbed constructor.
   * @param {boolean} [suppressTimeStamp = false] 
   *   You can override the color and timestamp here as well.
   */
    static embed(data = {}, suppressTimeStamp = false) {
        if (data?.author instanceof Discord.GuildMember) {
            data.author = {
                name: data.author.displayName,
                iconURL: data.author.user.displayAvatarURL()
            };
        } else if (data?.author instanceof Discord.User) {
            data.author = {
                name: data.author.username,
                iconURL: data.author.displayAvatarURL()
            };
        }
        const embed = new Discord.MessageEmbed(data);
        if (!data?.color) embed.setColor(this.color());
        if (!data?.timestamp && !suppressTimeStamp) embed.setTimestamp();
        return embed;
    }
    /**
  * Handles a command exception/error. Most likely called from a catch.
  * Reports the error and lets the user know.
  * @param {Error} error The error to report.
  * @param {Discord.Message|Discord.Interaction|string} message Any Discord.Message, Discord.Interaction, or text string.
  */
    static errorHandler(error, message = null) {
        
        if (!error || (error.name === "AbortError")) return;
        let fromConsole = error.fromConsole? error.fromConsole : false
        if(fromConsole) error = error.error || error;
        if(!fromConsole) console.error(Date());

        const embed = GeneralUtils.embed().setTitle(error.name ? error.name : "Warning").setColor("ORANGE");

        if (message instanceof Discord.Message) {
            const loc = (message.guild ? `${message.guild?.name} > ${message.channel?.name}` : "DM");
            if(!fromConsole) console.error(`${message.author.username} in ${loc}: ${message.cleanContent}`);

            message.channel.send("I've run into an error. I've let my devs know.")
                .then(GeneralUtils.clean);
            embed.addField("User", message.author.username, true)
                .addField("Location", loc, true)
                .addField("Command", message.cleanContent || "`undefined`", true);
        } else if (message instanceof Discord.Interaction) {
            const loc = (message.guild ? `${message.guild?.name} > ${message.channel?.name}` : "DM");
            if(!fromConsole) console.error(`Interaction by ${message.user.username} in ${loc}`);

            message[((message.deferred || message.replied) ? "editReply" : "reply")]({ content: "I've run into an error. I've let my devs know.", ephemeral: true }).catch(GeneralUtils.noop);
            embed.addField("User", message.user?.username, true)
                .addField("Location", loc, true);

            const descriptionLines = [message.commandId || message.customId || "`undefined`"];
            const { command, data } = parseInteraction(message) || { command: "unkown", data: [{ name: "unknown", value: "unknown" }] };
            descriptionLines.push(command);
            for (const datum of data) {
                descriptionLines.push(`${datum.name}: ${datum.value}`);
            }
            embed.addField("Interaction", descriptionLines.join("\n"));
        } else if (typeof message === "string") {
            if(!fromConsole) console.error(message);
            embed.addField("Message", message);
        }

        if(!fromConsole)  console.trace(error);

        let stack = (error.stack ? error.stack : error.toString());
        if (stack.length > 4096) stack = stack.slice(0, 4000);

        embed.setDescription(stack);
        errorLog.send({ embeds: [embed] });
    }
    static errorLog = errorLog;
    /**
     * logs something to the console and webhook
     * @param {string} message the message to send in the logs
     */
    static log(message) {
        //console.log(message)
        message = message.toString();
        if (message.length > 255) message = message.slice(0, 255);
        return errorLog.send({embeds: [this.embed({}, true).setTitle(message)]})
    }
    /**
  * This task is extremely complicated.
  * You need to understand it perfectly to use it.
  * It took millenia to perfect, and will take millenia
  * more to understand, even for scholars.
  *
  * It does literally nothing.
  * */
    static noop() {
        // No-op, do nothing
    }
    
    /**
   * Returns a promise that will fulfill after the given amount of time.
   * If awaited, will block for the given amount of time.
   * @param {number} t The time to wait, in seconds.
   */
    static wait(t) {
        return new Promise((fulfill) => {
            setTimeout(fulfill, t * 1000);
        });
    }

}

module.exports = GeneralUtils