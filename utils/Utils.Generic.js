const Discord = require("discord.js"),
  config = require("../config/config.json"),
  snowflakes = require("../config/snowflakes.json"),

  errorLog = new Discord.WebhookClient(config.Webhooks.error);
const { distance, closest } = require('fastest-levenshtein');
const rolesClient = require("./Utils.RolesLogin");
/**
 * @typedef {Object} ParsedInteraction
 * @property {String} command - The command issued, represented as a string.
 * @property {Array} data - Associated data for the command, such as command options or values selected.
 */

/**
 * Converts an interaction into a more universal format for error messages.
 * @param {Discord.Interaction} inter The interaction to be parsed.
 * @returns {ParsedInteraction} The interaction after it has been broken down.
 */
function parseInteraction(inter) {
  if (inter.isCommand()) {
    const commandParts = [`/${inter.commandName}`];
    let optionData = inter.options.data;
    if (optionData.length == 0) {
      return {
        command: commandParts.join(" "),
        data: optionData
      };
    }

    if (optionData[0].type == "SUB_COMMAND_GROUP") {
      commandParts.push(optionData[0].name);
      optionData = optionData[0].options;
      if (optionData.length == 0) {
        return {
          command: commandParts.join(" "),
          data: optionData
        };
      }
    }

    if (optionData[0].type == "SUB_COMMAND") {
      commandParts.push(optionData[0].name);
      optionData = optionData[0].options;
      return {
        command: commandParts.join(" "),
        data: optionData ?? []
      };
    }
  }

  if (inter.isContextMenu()) {
    return {
      command: `[Context Menu] ${inter.commandName}`,
      data: inter.options.data
    };
  }

  if (inter.isMessageComponent()) {
    const data = [{
      name: "Message",
      value: inter.message.guild ? `[Original Message](${inter.message.url})` : "(DM)"
    }];
    const command = inter.isButton() ? `[Button] ${(inter.component?.emoji?.name ?? "") + (inter.component?.label ?? "")}` : "[Select Menu]";

    if (inter.isSelectMenu()) {
      data.push({ name: "Selection", value: inter.values.join() });
    }

    return { command, data };
  }
}
let _client = null;
const utils = {
  setClient: (client) => {
    _client = client;
  },
  getClient: () => {
    return _client;
  },
  setRoles: async (member, roles) => {
    const guild = await rolesClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
    const rolesClientMember = await guild.members.fetch(member.id ? member.id : member);
    try {
      await rolesClientMember.roles.set(roles);
    } catch (error) {
      let stack = error.stack ? error.stack : error.toString()
      if (stack.indexOf("DiscordAPIError: Missing Permissions") > -1) {
        let embed = utils.embed({
          color: config.color,
          title: `I couldn't set a role for ${member.displayName} `,
          author: {
            name: member.displayName,
            icon_url: member.displayAvatarURL(),
          },
          description: `I don't have permission to sey the ${roles.map(r => `<@&${r}>`).join} roles for <@${member.id}>. Please set that for them on my behalf.`,
          timestamp: new Date().toISOString(),
          footer: {
            text: `Role set Permission Denied`,
          },

        }
        )
        guild.channels.cache.get(snowflakes.channels.modRequests).send({ content: `<@&${snowflakes.roles.Moderator}>`, embeds: [embed], allowedMentions: { roles: [snowflakes.roles.Moderator] } });
      }
      else utils.errorHandler(error);
    }


  },
  addRoles: async (member, roles, takeRoleInsteadOfGive = false) => {
    try {


      const guild = await rolesClient.guilds.fetch(snowflakes.guilds.PrimaryServer);
      const rolesClientMember = await guild.members.fetch(member.id ? member.id : member);
      const channel = await guild.channels.fetch(snowflakes.channels.general);
      let rolesArray;
      if (!Array.isArray(roles)) {
        rolesArray = [roles];
      } else rolesArray = roles;
      if (channel.permissionsFor(snowflakes.users.roleBot)?.toArray().includes("MANAGE_ROLES")) {
        try {
          if (takeRoleInsteadOfGive) {
            await rolesClientMember.roles.remove(rolesArray);
          }
          else await rolesClientMember.roles.add(rolesArray);
        } catch (error) {
          let stack = error.stack ? error.stack : error.toString()
          if (stack.indexOf("DiscordAPIError: Missing Permissions") > -1) {
            let embed = utils.embed({
              color: config.color,
              title: `I couldn't ${takeRoleInsteadOfGive ? 'remove' : 'grant'} a role ${takeRoleInsteadOfGive ? 'from' : 'to '} ${member.displayName} `,
              author: {
                name: member.displayName,
                icon_url: member.displayAvatarURL(),
              },
              description: `I don't have permission to ${takeRoleInsteadOfGive ? 'remove' : 'grant'} the <@&${rolesArray[0]}> role ${takeRoleInsteadOfGive ? 'from' : 'to '} <@${member.id}>. Please ${takeRoleInsteadOfGive ? 'remove' : 'grant'} that to them on my behalf.`,
              timestamp: new Date().toISOString(),
              footer: {
                text: `Role ${takeRoleInsteadOfGive ? 'Remove' : 'Grant'} Permission Denied`,
              },

            }
            )
            guild.channels.cache.get(snowflakes.channels.modRequests).send({ content: `<@&${snowflakes.roles.Moderator}>`, embeds: [embed], allowedMentions: { roles: [snowflakes.roles.Moderator] } });
          }
          else utils.errorHandler(error);

        }

      } else {

        let embed = await utils.modRequestEmbed("Role Request", { member: rolesClientMember, guild: rolesClientMember.guild, createdAt: Date.now(), cleanContent: " Dummy Text" }, { member: rolesClientMember }, rolesClient)
        if (roles.length < 1) {
          return;
        }
        embed.setDescription(`${member.displayName} needs to ${takeRoleInsteadOfGive ? "have the following role(s) removed" : "be given the following role(s)"}:\n>>> <@&${roles.join(">\n<@&")}>`);
        await rolesClientMember.guild.channels.cache.get(snowflakes.channels.modRequests).send({ embeds: [embed] });
      }
    } catch (error) {
      utils.errorHandler(error);
    }
  },
  /**
   * After the given amount of time, attempts to delete the message.
   * @param {Discord.Message|Discord.Interaction} msg The message to delete.
   * @param {number} t The length of time to wait before deletion, in milliseconds.
   */
  clean: async function (msg, t = 20000) {
    await utils.wait(t);
    if (msg instanceof Discord.CommandInteraction) {
      msg.deleteReply().catch(utils.noop);
    } else if ((msg instanceof Discord.Message) && (msg.deletable)) {
      msg.delete().catch(utils.noop);
    }
    return Promise.resolve(msg);
  },
  /**
   * After the given amount of time, attempts to delete the interaction.
   * @param {Discord.Interaction} interaction The interaction to delete.
   * @param {number} t The length of time to wait before deletion, in milliseconds.
   */
  cleanInteraction: async function (interaction, t = 2000) {
    await utils.wait(t);
    try {
      interaction.deleteReply();
    } catch (error) {
      console.log("could not delete interaction reply")
      console.error(error);
    }

  },
  /**
   * Shortcut to Discord.Collection. See docs there for reference.
   */
  Collection: Discord.Collection,
  /**
   * Shortcut to Discord.Util.escapeMarkdown. See docs there for reference.
   */
  escapeText: Discord.Util.escapeMarkdown,
  /**
   * Returns a MessageEmbed with basic values preset, such as color and timestamp.
   * @param {any} data The data object to pass to the MessageEmbed constructor.
   * @param {boolean} [suppressTimeStamp = false] 
   *   You can override the color and timestamp here as well.
   */
  embed: function (data = {}, suppressTimeStamp = false) {
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
    if (!data?.color) embed.setColor(config.color);
    if (!data?.timestamp && !suppressTimeStamp) embed.setTimestamp();
    return embed;
  },
  /**
   * Handles a command exception/error. Most likely called from a catch.
   * Reports the error and lets the user know.
   * @param {Error} error The error to report.
   * @param {any} message Any Discord.Message, Discord.Interaction, or text string.
   */
  errorHandler: function (error, message = null, botName = null) {
    if (!error || (error.name === "AbortError")) return;

    console.error(Date());

    const embed = utils.embed().setTitle(error.name ? error.name : "Warning");
    if (botName) {
      embed.setTitle("Mysterious Test Entity:" + (error.name ? error.name : "Warning"));
    }

    if (message instanceof Discord.Message) {
      const loc = (message.guild ? `${message.guild?.name} > ${message.channel?.name}` : "DM");
      console.error(`${message.author.username} in ${loc}: ${message.cleanContent}`);

      message.channel.send("I've run into an error. I've let my devs know.")
        .then(utils.clean);
      embed.addField("User", message.author.username, true)
        .addField("Location", loc, true)
        .addField("Command", message.cleanContent || "`undefined`", true);
    } else if (message instanceof Discord.Interaction) {
      const loc = (message.guild ? `${message.guild?.name} > ${message.channel?.name}` : "DM");
      console.error(`Interaction by ${message.user.username} in ${loc}`);

      message[((message.deferred || message.replied) ? "editReply" : "reply")]({ content: "I've run into an error. I've let my devs know.", ephemeral: true }).catch(utils.noop);
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
      console.error(message);
      embed.addField("Message", message);
    }

    console.trace(error);

    let stack = (error.stack ? error.stack : error.toString());
    if (stack.length > 4096) stack = stack.slice(0, 4000);

    embed.setDescription(stack);
    errorLog.send({ embeds: [embed] });
  },
  errorLog,
  /**
   * Fetch partial Discord objects
   * @param {*} obj The Discord object to fetch.
   */
  fetchPartial: (obj) => { return obj.fetch(); },
  modRequestEmbed: async (modRequestFunctionName, message, interaction, user, modRequestFunctionEmoji) => {
    let requestingUser = user ? message?.guild?.members?.cache.get(user.id) || interaction.member : interaction.member;
    let embed = utils.embed({ color: 0xF0004C, author: message.member, timestamp: (message.editedAt ?? message.createdAt) })
      .setTitle(`${modRequestFunctionName} request by ` + `${requestingUser.displayName}`)
      .setColor(0xF0004C)
      .setTimestamp()
      .setAuthor({ name: `${message.member?.displayName || interaction.member?.displayName || requestingUser?.username} ${modRequestFunctionEmoji ? modRequestFunctionEmoji : ""}`, iconURL: message.member.user.displayAvatarURL() })
      .setDescription(`Message: ${message.cleanContent || message} `)
      .addField(`${modRequestFunctionName} requested by `, requestingUser.displayName)
    if (message.channel) embed.addField("Channel", message.channel.toString())
    if (message.url) embed.addField("Jump to Post", `[Original Message](${message.url})`);
    if (message.attachments?.size > 0)
      embed.setImage(message.attachments?.first()?.url);
    return embed;
  },
  getMention: async function (msg, getMember = true) {
    try {
      let { suffix } = utils.parse(msg);
      if (msg.guild) {
        let memberMentions = msg.mentions.members;
        memberMentions.delete(msg.client.user.id);
        if (memberMentions.size > 0) {
          return (getMember ? memberMentions.first() : memberMentions.first().user);
        } else if (suffix && /^(.*)#(\d{4})$/.test(suffix)) {
          let member = msg.guild.members.cache.find(m => m.user.tag.toLowerCase() == suffix.toLowerCase());
          return member;
        } else if (suffix) {
          let member = (await msg.guild.members.fetch({ query: suffix })).first();
          if (member) return (getMember ? member : member.user);
          else return undefined;
        } else return (getMember ? msg.member : msg.author);
      } else {
        let userMentions = msg.mentions.users;
        userMentions.delete(msg.client.user.id);
        return userMentions.first() || msg.author;
      }
    } catch (error) {
      utils.errorHandler(error, msg);
      return null;
    }
  },
  /**
   * This task is extremely complicated.
   * You need to understand it perfectly to use it.
   * It took millenia to perfect, and will take millenia
   * more to understand, even for scholars.
   *
   * It does literally nothing.
   * */
  noop: () => {
    // No-op, do nothing
  },
  /**
   * Returns an object containing the command, suffix, and params of the message.
   * @param {Discord.Message} msg The message to get command info from.
   * @param {boolean} clean Whether to use the messages cleanContent or normal content. Defaults to false.
   */
  parse: (msg, clean = false) => {
    for (const prefix of [config.prefix, `<@${msg.client.user.id}>`, `<@!${msg.client.user.id}>`]) {
      const content = clean ? msg.cleanContent : msg.content;
      if (!content.startsWith(prefix)) continue;
      const trimmed = content.substr(prefix.length).trim();
      let [command, ...params] = trimmed.split(" ");
      if (command) {
        let suffix = params.join(" ");
        if (suffix.toLowerCase() === "help") { // Allow `!command help` syntax
          const t = command.toLowerCase();
          command = "help";
          suffix = t;
          params = t.split(" ");
        }
        return {
          command: command.toLowerCase(),
          suffix,
          params
        };
      }
    }
    return null;
  },
  /**
   * Choose a random element from an array
   * @function rand
   * @param {Array} selections Items to choose from
   * @returns {*} A random element from the array
   */
  rand: function (selections) {
    return selections[Math.floor(Math.random() * selections.length)];
  },
  /**
   * 
   * @param {string[]} array //The array to search through
   * @param {string} searchTerm //The term to search for
   * @param {number} [tolerance] //The maximum levenshtein distance to allow
   * @param {number} [size] //The maximum number of results to return
   * @returns {string[]}
   * 
   */
  smartSearchSort: function (array, searchTerm, tolerance, size = 5) {
    const levenshteinTolerance = tolerance || 2;
    let pages = array.sort((a, b) => {

      let aIncludes = a.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
      let bIncludes = b.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;

      if (aIncludes && !bIncludes) {
        return -1; // 'a' contains searchTerm, prioritize it over 'b'
      } else if (!aIncludes && bIncludes) {
        return 1; // 'b' contains searchTerm, prioritize it over 'a'
      } else if (aIncludes && bIncludes) {
        return a.toLowerCase().indexOf(searchTerm.toLowerCase()) - b.toLowerCase().indexOf(searchTerm.toLowerCase())
      } else {
        const distanceA = distance(a, searchTerm);
        const distanceB = distance(b, searchTerm);
        let finalDistanceA;
        let finalDistanceB;
        if (searchTerm.length < a.length) {
          const distanceAAtLength = distance(a.slice(0, searchTerm.length).toLowerCase(), searchTerm.toLowerCase());
          finalDistanceA = distanceA > distanceAAtLength ? distanceAAtLength : distanceA;
        } else {
          finalDistanceA = distanceA;
        }


        if (searchTerm.length < b.length) {
          const distanceBAtLength = distance(b.slice(0, searchTerm.length).toLowerCase(), searchTerm.toLowerCase());
          finalDistanceB = distanceB > distanceBAtLength ? distanceBAtLength : distanceB;
        } else {
          finalDistanceB = distanceB;
        }

        return finalDistanceA - finalDistanceB; // Sort based on distance for other cases
      }
    });


    //find the last page before the page where distance is greater than 3

    let numberOfPages = pages.length > size ? size : pages.length;

    let tooFarAwayIndex = pages.slice(0, numberOfPages).findIndex(
      page =>
        page.toLowerCase().indexOf(searchTerm.toLowerCase()) == -1
        && distance(page.toLowerCase(), searchTerm.toLowerCase()) > levenshteinTolerance
        && distance(page.slice(0, searchTerm.length).toLowerCase(), searchTerm.toLowerCase()) > levenshteinTolerance);
    let finalNumberOfPages = tooFarAwayIndex > -1 ? tooFarAwayIndex : numberOfPages;
    return pages.slice(0, finalNumberOfPages)
  },
  /**
   *  splits a string into chunks of 1900 characters, splitting on the last newline or space if possible
   * @param {string} message The string to split
   * @returns {string[]} An array of strings, each of which is less than 1900 characters
   **/
  splitMessage: (message) => {
    const chunks = [];
    let currentChunk = '';

    while (message.length > 0) {
      if (message.length <= 1900) {
        chunks.push(message);
        break;
      }

      let chunk = message.substr(0, 1900);

      // Check if there is a newline within the chunk
      const newlineIndex = chunk.lastIndexOf('\n');

      if (newlineIndex >= 1800 && newlineIndex < 1900) {
        // Split on the last newline within the chunk
        chunk = chunk.substr(0, newlineIndex + 1);
        chunks.push(currentChunk + chunk);
        message = message.substr(newlineIndex + 1);
        currentChunk = '';
      } else {
        // Split on the last space within the chunk
        const lastSpaceIndex = chunk.lastIndexOf(' ');
        if (lastSpaceIndex !== -1) {
          chunk = chunk.substr(0, lastSpaceIndex + 1);
          chunks.push(currentChunk + chunk);
          message = message.substr(lastSpaceIndex + 1);
          currentChunk = '';
        } else {
          // No space found, split at 1900 characters
          chunks.push(currentChunk + chunk);
          message = message.substr(1900);
          currentChunk = '';
        }
      }
    }

    return chunks;
  },
  /**
   * Returns a promise that will fulfill after the given amount of time.
   * If awaited, will block for the given amount of time.
   * @param {number} t The time to wait, in milliseconds.
   */
  wait: function (t) {
    return new Promise((fulfill) => {
      setTimeout(fulfill, t);
    });
  }
};

module.exports = utils;