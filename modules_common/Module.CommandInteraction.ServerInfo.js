const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const { MessageButton, MessageActionRow } = require("discord.js");


let memeLinks = [
  "https://wydds.cc/important.mp4",
  "https://i.imgflip.com/5frirx.jpg",
  "https://www.youtube.com/watch?v=bxqLsrlakK8",
  "https://www.youtube.com/watch?v=k4h6WK0D4O8",
  "https://www.youtube.com/watch?v=kCXzb1BGRrs"
]


const Module = new Augur.Module()
  .addInteractionCommand({
    name: "staff",
    process: async (interaction) => {
      await interaction.deferReply?.({ ephemeral: false });

      try {
        // 1. Grab the IDs from config (safely fallback to an empty object if roles isn't defined)
        const rolesConfig = Module.config.snowflakes.roles || {};
        let adminId = rolesConfig.Admin;
        let modId = rolesConfig.Moderator;
        let guideId = rolesConfig.CommunityGuide;

        let botMasterId = rolesConfig.BotMaster;
        let botAssistId = rolesConfig.BotAssistant;


        let foundRoles = [adminId, modId, guideId, botMasterId, botAssistId].filter(id => id); // Filter out undefined/null IDs

        // If no roles are configured, we can exit early
        if (foundRoles.length === 0) {
          return interaction.editReply({ content: "Error: No staff roles are configured for this server!" });
        }

        if (adminId == modId && adminId) {
          modId = null; // Avoid confusion if Admin and Moderator roles are the same
        }

        if (adminId == guideId && adminId) {
          guideId = null; // Avoid confusion if Admin and Guide roles are the same
        }

        if (modId == guideId && modId) {
          guideId = null; // Avoid confusion if Moderator and Guide roles are the same
        }

        if (botMasterId == botAssistId && botMasterId) {
          botAssistId = null; // Avoid confusion if BotMaster and BotAssistant roles are the same
        }

        // 2. Fetch roles ONLY if we have an ID for them
        // Using a ternary operator: if guideId exists, fetch it. Otherwise, return null.
        let guideRole = guideId ? await interaction.guild.roles.fetch(guideId).catch(() => null) : null;
        let adminRole = adminId ? await interaction.guild.roles.fetch(adminId).catch(() => null) : null;
        let modRole = modId ? await interaction.guild.roles.fetch(modId).catch(() => null) : null;
        let botMasterRole = botMasterId ? await interaction.guild.roles.fetch(botMasterId).catch(() => null) : null;
        let botAssistantRole = botAssistId ? await interaction.guild.roles.fetch(botAssistId).catch(() => null) : null;

        // Safety Check: Make sure at least ONE staff role was found
        if (!guideRole && !adminRole && !modRole && !botMasterRole && !botAssistantRole) {
          return interaction.editReply({ content: "Error: No valid staff roles were found in this bot's configuration for this server!" });
        }

        // 3. Safely calculate members
        let SW = "";
        if (guideRole) {
          SW = guideRole.members
            .filter(m => {
              // Only check admin/mod permissions if those roles actually exist in this server
              let isAdmin = adminRole ? adminRole.members.has(m.id) : false;
              let isMod = modRole ? modRole.members.has(m.id) : false;
              return !isAdmin && !isMod;
            })
            .map(m => m.displayName).sort().join("\n");
        }

        // Map the rest, falling back to empty strings if the role doesn't exist
        let Admin = adminRole ? adminRole.members.map(m => m.displayName).join("\n") : "";
        let Mod = modRole ? modRole.members.map(m => m.displayName).join("\n") : "";
        let botMasters = botMasterRole ? botMasterRole.members.map(m => m.displayName).join("\n") : "";
        let BotAssistants = botAssistantRole ? botAssistantRole.members.map(m => m.displayName).join("\n") : "";

        // Fallback color in case the server doesn't have a Moderator role configured
        let color = modRole ? modRole.hexColor : "#0099ff";

        // 4. Dynamically build the description string
        // This ensures that if a server doesn't have a "BotMaster" role, it simply won't show up in the embed at all
        let desc = "";
        if (adminRole) desc += `<@&${adminId}>:\n\`\`\`\n${Admin || "None"}\n\`\`\`\n\n`;
        if (modRole) desc += `<@&${modId}>:\n\`\`\`\n${Mod || "None"}\n\`\`\`\n\n`;
        if (guideRole) desc += `<@&${guideId}>:\n\`\`\`\n${SW || "None"}\n\`\`\`\n\n`;
        if (botMasterRole) desc += `<@&${botMasterId}>:\n\`\`\`\n${botMasters || "None"}\n\`\`\`\n\n`;
        if (botAssistantRole) desc += `<@&${botAssistId}>:\n\`\`\`\n${BotAssistants || "None"}\n\`\`\`\n\n`;

        // 5. Build and send Embed
        let embed = u.embed()
          .setTitle("Current " + interaction.guild.name + " Staff Members:")
          .setDescription(desc)
          .addFields([
            {
              name: "Join our staff:",
              value: Module.config.staffApplicationLink ? Module.config.staffApplicationLink : "```No Staff Application link is available at this time```"
            }
          ])
          .setColor(color);

        interaction.editReply({ embeds: [embed] });

      } catch (e) {
        // Fallback in case something completely unexpected happens
        console.error(e);
        interaction.editReply({ content: "An error occurred while building the staff list." });
      }
    }
  })
  .addInteractionCommand({
    name: "repo",

    process: async (interaction) => {
      let components = new MessageActionRow()
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "View My Code",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi/"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "Request a feature",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi/issues/new/choose"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "Report a bug",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi/issues/new/choose"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "See Current Projects",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi/projects/1"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "Support the Developers",
            style: "LINK",
            url: "https://www.patreon.com/GhostBotCode"
          }));

      await interaction.reply({ content: "**__Helpful Links__**", components: [components], ephemeral: false });
    }

  })
  .addInteractionCommand({
    name: "links",

    process: async (interaction) => {
      let components = new MessageActionRow()
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "The Author's Blog",
            style: "LINK",
            url: "https://andrewkrowe.wordpress.com/"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "The Wiki",
            style: "LINK",
            url: "https://andrewkrowe.wordpress.com/"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "The Perfect Stranger Discord Server",
            style: "LINK",
            url: "https://discord.gg/VMmtJsRNZ2"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "The Code",
            style: "LINK",
            url: "https://github.com/chevyboys/Mizuchi"
          }))
        .addComponents(
          new MessageButton({
            disabled: false,
            label: "Adorable Cockatrices",
            style: "LINK",
            url: memeLinks[Math.floor(Math.random() * memeLinks.length)]
          }));

      await interaction.reply({ content: "**__Cool things to check out:__**", components: [components], ephemeral: false });
    }

  })
  .addInteractionCommand({
    name: "tone",

    process: async (interaction) => {
      let toneTags = ['/cb = clickbait', '/cp = copypasta', '/f = fake', '/gen or /g = genuine', '/hj = half-joking', '/hyp = hyperbole', '/ij = inside joke', '/j = joking', '/l or /ly = lyrics', '/lh = light-hearted', '/li = literally', '/lu = a little upset', '/m = metaphorically', '/neg or /nc = negative connotation', '/neu = neutral connotation', '/nm = not mad', '/nsrs = non-serious', '/p = platonic', '/pc = positive connotation', '/r = romantic', '/rh or /rt = rhetorical question', '/s = sarcastic', '/srs = serious', '/t = teasing', '/vent = venting']
      await interaction.reply({ content: "**__Tone Tags:__**\n" + toneTags.join("\n"), ephemeral: false });
    }

  })

module.exports = Module;
