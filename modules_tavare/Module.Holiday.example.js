const Augur = require("augurbot");
const u = require("../utils/Utils.Generic");
const db = require("../utils/Utils.Database");

const Module = new Augur.Module();

// =========================================================================
// EVENT TEMPLATE
// Fill this in with something reasonable!
// =========================================================================
const NEW_EVENT_TEMPLATE = {
  name: "Sample Holiday Event",
  start: "2026-10-01", // Date string YYYY-MM-DD, ISO string, or Date object
  end: "2026-10-31",
  embed_color: "#FF0000",
  enabled: true,
  announcementMessage: "Welcome to the Sample Holiday Event!",
  data: {
    bonus_multiplier: 1.5,
    custom_field: "something"
  },
  // Array of DBGuildObjects, guild IDs, or guild snowflakes.
  // If left empty, the command will default to using the command's guild ([msg.guild]).
  guilds: [],

  // Map of guild snowflakes or guild DB IDs -> DBWebhook instance, webhook ID, or webhook config object.
  // Example:
  // DBWebhooks_map: {
  //   "123456789012345678": {
  //     name: "Holiday Announcements",
  //     avatar: "https://example.com/avatar.png",
  //     channel_snowflake: "987654321098765432"
  //   }
  // }
  DBWebhooks_map: {
    "879564413751918593": new db.DBWebhook({
      name: "Ghost's Bot",
      guild_id: db.Guild.get("879564413751918593").then(g => g.id),
      avatar: "https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png",
      channel_snowflake: "1290926089379516437"
    })
  },

  // Array of role templates or DBEventRoleTemplate instances
  roleTemplates: [
    {
      name: "Event Participant",
      color: "#00FF00",
      gradient_secondary_color: "#0000FF",
      icon: "🎉"
    }
  ]
};

Module.addCommand({
  name: "createevent",
  description: "Create an event in the DB using NEW_EVENT_TEMPLATE",
  syntax: "",
  permissions: (msg) => msg.member?.permissions.has("ADMINISTRATOR"),
  process: async (msg) => {
    try {
      const guildObj = await db.Guild.get(msg.guild.id);
      if (!guildObj) return msg.reply("Failed to retrieve guild from DB.");

      const eventPayload = {
        ...NEW_EVENT_TEMPLATE,
        guilds: NEW_EVENT_TEMPLATE.guilds && NEW_EVENT_TEMPLATE.guilds.length > 0
          ? NEW_EVENT_TEMPLATE.guilds
          : [guildObj]
      };

      const event = await db.DBGuildEvent.new(eventPayload);
      return msg.reply(`Successfully created event **${event.name}**!\n- Event ID (Global): \`${event.eventId}\`\n- Guild Event ID: \`${event.id}\``);
    } catch (e) {
      u.errorHandler(e, msg);
    }
  }
}).addCommand({
  name: "testevent",
  description: "Test DBGuildEvent methods",
  syntax: "<create | getactive | getbyid <id> | getbyname <name> | getdata <id> | userdata <id> <user_snowflake>>",
  permissions: (msg) => msg.member?.permissions.has("ADMINISTRATOR"),
  process: async (msg, suffix) => {
    try {
      const args = suffix.split(" ");
      const action = args.shift()?.toLowerCase();

      if (!action) {
        return msg.reply("Please specify an action. (create, getactive, getbyid, getbyname, getdata, userdata, currencies, roles, templates, setdata, setuserdata, sendannouncement)");
      }

      const guildObj = await db.Guild.get(msg.guild.id);
      if (!guildObj) return msg.reply("Failed to get guild object from database.");
      const guildDbId = guildObj.id;

      let event;

      if (action === "create") {
        const payload = {
          ...NEW_EVENT_TEMPLATE,
          guilds: NEW_EVENT_TEMPLATE.guilds && NEW_EVENT_TEMPLATE.guilds.length > 0
            ? NEW_EVENT_TEMPLATE.guilds
            : [guildObj]
        };

        const createdEvent = await db.DBGuildEvent.new(payload);
        return msg.reply(`Event '${createdEvent.name}' (ID: ${createdEvent.id}) successfully created using NEW_EVENT_TEMPLATE!`);
      }

      if (action === "getactive") {
        event = await db.DBGuildEvent.getActive(guildDbId);
        if (Array.isArray(event)) event = event[0];
        if (!event) return msg.reply("No active event found.");
        let json = await event.toAsyncJSON();
        return msg.reply(`Active Event: \`\`\`json\n${JSON.stringify(json, null, 2)}\`\`\``);
      }

      if (action === "getbyid") {
        const id = parseInt(args[0]);
        if (isNaN(id)) return msg.reply("Please provide a valid event ID.");
        event = await db.DBGuildEvent.getById(guildDbId, id);
        if (!event) return msg.reply(`No event found with ID ${id}.`);
        let json = await event.toAsyncJSON();
        return msg.reply(`Event by ID: \`\`\`json\n${JSON.stringify(json, null, 2)}\`\`\``);
      }

      if (action === "getbyname") {
        const name = args.join(" ");
        if (!name) return msg.reply("Please provide an event name.");
        event = await db.DBGuildEvent.getByName(guildDbId, name);
        if (!event) return msg.reply(`No event found with name ${name}.`);
        let json = await event.toAsyncJSON();
        return msg.reply(`Event by Name: \`\`\`json\n${JSON.stringify(json, null, 2)}\`\`\``);
      }

      event = await db.DBGuildEvent.getActive(guildDbId);
      if (Array.isArray(event)) event = event[0];
      if (!event) return msg.reply("No active event found for further actions.");

      switch (action) {
        case "getdata":
          const data = await event.getData();
          return msg.reply(`Event Data: \`\`\`json\n${JSON.stringify(data, null, 2).substring(0, 1900)}\`\`\``);

        case "userdata":
          const targetUser = args[0] || msg.author.id;
          const userData = await event.getUserData(targetUser, true);
          return msg.reply(`User Data for ${targetUser}: \`\`\`json\n${JSON.stringify(userData, null, 2).substring(0, 1900)}\`\`\``);

        case "currencies":
          const currencies = await event.getEventCurrencies();
          return msg.reply(`Currencies: \`\`\`json\n${JSON.stringify(currencies, null, 2).substring(0, 1900)}\`\`\``);

        case "roles":
          const roles = await event.getDiscordRoles(msg.guild);
          const roleMap = {};
          for (const key in roles) {
            roleMap[key] = roles[key]?.name || "Unknown/Missing";
          }
          return msg.reply(`Discord Roles: \`\`\`json\n${JSON.stringify(roleMap, null, 2)}\`\`\``);

        case "templates":
          const eventTemplates = await db.DBGuildEvent.getEventRoleTemplates(event.eventId);
          return msg.reply(`Role Templates: \`\`\`json\n${JSON.stringify(eventTemplates, null, 2).substring(0, 1900)}\`\`\``);

        case "setuserdata":
          if (!args[1]) return msg.reply("Usage: setuserdata <user_snowflake> <data_json>");
          const uData = JSON.parse(args.slice(1).join(" "));
          await event.setUserData(args[0], uData);
          return msg.reply("User data set successfully.");

        case "setdata":
          if (!args[0]) return msg.reply("Usage: setdata <data_json>");
          const eData = JSON.parse(args.join(" "));
          await event.setData(eData);
          return msg.reply("Event data set successfully.");

        case "sendannouncement":
          await event.send_announcement({ content: args.join(" ") || "Test announcement!" });
          return msg.reply("Announcement sent.");

        default:
          return msg.reply("Unknown action.");
      }
    } catch (e) {
      u.errorHandler(e, msg);
    }
  }
});

module.exports = Module;
