const Discord = require("discord.js"),
  errorUtil = require('./Utils.Error'),
  get_log_webhook = errorUtil.get_log_webhook,
  log = errorUtil.log,
  errorHandler = errorUtil.errorHandler,
  embedUtil = require('../utils/Utils.Embed'),
  embed = embedUtil.embed;
const { distance, closest } = require('fastest-levenshtein');
const create_roles_client = require("./Utils.RolesLogin");
const { parseInteraction } = require("./Utils.ParseInteraction.js");

let _client = null;
const utils = {
  setClient: (client) => {
    _client = client;
  },
  getClient: () => {
    return _client;
  },
  setRoles: async (member, roles) => {
    const rolesClient = create_roles_client(member.client.config);
    const guild = await rolesClient.guilds.fetch(rolesClient.config.snowflakes.guilds.PrimaryServer);
    const rolesClientMember = await guild.members.fetch(member.id ? member.id : member);
    try {
      await rolesClientMember.roles.set(roles);
    } catch (error) {
      let stack = error.stack ? error.stack : error.toString()
      if (stack.indexOf("DiscordAPIError: Missing Permissions") > -1) {
        let embed = utils.embed({
          color: rolesClient.config.color,
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
        guild.channels.cache.get(rolesClient.config.snowflakes.channels.modRequests).send({ content: `<@&${rolesClient.config.snowflakes.roles.Moderator}>`, embeds: [embed], allowedMentions: { roles: [rolesClient.config.snowflakes.roles.Moderator] } });
      }
      else errorHandler(error);
    }


  },
  addRoles: async (member, roles, takeRoleInsteadOfGive = false) => {
    try {
      const rolesClient = create_roles_client(member.client.config);
      const guild = await rolesClient.guilds.fetch(rolesClient.config.snowflakes.guilds.PrimaryServer);
      const rolesClientMember = await guild.members.fetch(member.id ? member.id : member);
      const channel = await guild.channels.fetch(rolesClient.config.snowflakes.channels.general);
      let rolesArray;
      if (!Array.isArray(roles)) {
        rolesArray = [roles];
      } else rolesArray = roles;
      if (channel.permissionsFor(rolesClient.config.snowflakes.users.roleBot)?.toArray().includes("MANAGE_ROLES")) {
        try {
          if (takeRoleInsteadOfGive) {
            await rolesClientMember.roles.remove(rolesArray);
          }
          else await rolesClientMember.roles.add(rolesArray);
        } catch (error) {
          let stack = error.stack ? error.stack : error.toString()
          if (stack.indexOf("DiscordAPIError: Missing Permissions") > -1) {
            let embed = utils.embed({
              color: rolesClient.config.color,
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
            guild.channels.cache.get(rolesClient.config.snowflakes.channels.modRequests).send({ content: `<@&${rolesClient.config.snowflakes.roles.Moderator}>`, embeds: [embed], allowedMentions: { roles: [rolesClient.config.snowflakes.roles.Moderator] } });
          }
          else errorHandler(error);
        }

      } else {

        let embed = await utils.modRequestEmbed("Role Request", { member: rolesClientMember, guild: rolesClientMember.guild, createdAt: Date.now(), cleanContent: " Dummy Text" }, { member: rolesClientMember }, rolesClient)
        if (roles.length < 1) {
          return;
        }
        embed.setDescription(`${member.displayName} needs to ${takeRoleInsteadOfGive ? "have the following role(s) removed" : "be given the following role(s)"}:\n>>> <@&${roles.join(">\n<@&")}>`);
        await rolesClientMember.guild.channels.cache.get(rolesClient.config.snowflakes.channels.modRequests).send({ embeds: [embed] });
      }
    } catch (error) {
      errorHandler(error);
    }
  },
  clean: errorUtil.clean,
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
  embed: embed,
  errorHandler: errorHandler,
  get_log_webhook: get_log_webhook,
  log: log,
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
      errorHandler(error, msg);
      return null;
    }
  },
  /**
   * This task is extremely complicated.
   * You need to understand it perfectly to use it.
   * It took millennia to perfect, and will take millennia
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
    for (const prefix of [msg.client.config.prefix, `<@${msg.client.user.id}>`, `<@!${msg.client.user.id}>`]) {
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