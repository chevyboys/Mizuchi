const Module = new (require("augurbot")).Module;
const u = require("../utils/Utils.Generic.js");
const db = require("../utils/Utils.Database.js");
const { SlashCommandBuilder } = require("discord.js");


Module.addInteractionCommand({
  name: "inventory-grant",
  process: async (interaction) => {
    if (interaction.member.id !== Module.config.ownerId) {
      await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });

    const grantee = interaction.options.getRole("grantee");
    const granted = interaction.options.getRole("granted");
    const inherit = interaction.options.getRole("inherit");
    const isColor = interaction.options.getBoolean("is_color");

    const reason = `Granted via slash command by ${interaction.user.username}`;

    try {
      const addedCount = await db.Inventory.grantRoleToRole(
        grantee.id,
        granted.id,
        inherit ? inherit.id : null,
        reason,
        isColor
      );

      await interaction.editReply({
        content: `✅ **Success!** Added **${addedCount}** item(s) to the inventory of ${grantee}.\n\nPrimary Item: ${granted} *(Color: ${isColor})*${inherit ? `\nInherited items from: ${inherit}` : ""}`
      });

    } catch (error) {
      if (error.message.includes("not registered")) {
        await interaction.editReply({ content: `⚠️ **Error:** ${error.message}` });
      } else {
        u.errorHandler(error, interaction);
        await interaction.editReply({ content: "An unexpected database error occurred while trying to link these roles." });
      }
    }
  }
});

module.exports = Module;