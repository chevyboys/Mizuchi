const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");


const Module = new Augur.Module()
  .addInteractionCommand({
    name: "role_permissions",
    process: async (interaction) => {
      let targetRole = interaction.options.getRole("role");
      if (!targetRole) return interaction.reply({ content: "Please specify a valid role.", ephemeral: true });
      await interaction.deferReply?.({ ephemeral: false });
      let isAllowed = interaction.member.roles.cache.has(Module.config.snowflakes.roles.Admin) ||
        interaction.member.roles.cache.has(Module.config.snowflakes.roles.Moderator) ||
        interaction.member.roles.cache.has(Module.config.snowflakes.roles.BotMaster) ||
        interaction.member.roles.cache.has(Module.config.snowflakes.roles.BotAssistant)
      if (!isAllowed) return;
      try {
        let roleId = targetRole.id;
        if (!interaction.guild) return -1;

        const role = await interaction.guild.roles.fetch(roleId);
        if (!role) throw new Error("Role not found in this guild.");

        const everyoneRole = interaction.guild.roles.everyone;

        const channelsWithUniquePerms = {};

        interaction.guild.channels.cache.forEach(channel => {
          if (typeof channel.permissionsFor !== 'function') return;

          const rolePerms = channel.permissionsFor(role);
          const everyonePerms = channel.permissionsFor(everyoneRole);

          if (!rolePerms || !everyonePerms) return;

          const uniquePerms = rolePerms.toArray().filter(perm => !everyonePerms.has(perm));

          if (uniquePerms.length > 0) {
            interaction.followUp(`<#${channel.id}> : ${uniquePerms}`);
          }
        });

        return JSON.stringify(channelsWithUniquePerms, 0, 4);

        interaction.editReply({ content: `Done` });
      } catch (e) {
        // Fallback in case something completely unexpected happens
        console.error(e);
        interaction.editReply({ content: "An error occurred while building the role info list." });
      }
    }
  })


module.exports = Module;
