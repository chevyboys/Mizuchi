const Module = new (require("augurbot")).Module;
const u = require("../utils/Utils.Generic.js");
const db = require("../utils/Utils.Database.js");
const { User_Guild_Inventory } = db;
const { MessageActionRow, MessageSelectMenu, CommandInteraction, User } = require("discord.js");

function inventory_item_embed_string(interaction, item, member_roles_cache = interaction.member.roles.cache) {
  let snowflake = item.granted_role_snowflake;
  if (snowflake) {
    //determine if the person has this role right now
    let hasRole = member_roles_cache.has(snowflake);
    return `<@&${snowflake}> ${hasRole ? "✅" : ""}`;
  }
  return item.toString();
}

async function inventory_embed(interaction, inventory, member_roles_cache) {
  if (!member_roles_cache) {
    let freshMember = await interaction.member.fetch(true);
    member_roles_cache = freshMember.roles.cache;
  }
  inventory = inventory || await User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
  if (inventory.length == 0) {
    return u.embed({ title: `${interaction.member.displayName}'s Inventory`, description: "Your inventory is empty!" });
  } else {
    let roles_strings = inventory.filter(item => !item.is_color).map(item => inventory_item_embed_string(interaction, item, member_roles_cache));
    let colors_strings = inventory.filter(item => item.is_color).map(item => inventory_item_embed_string(interaction, item, member_roles_cache));
    let fields = [];
    if (roles_strings.length > 0) fields.push({ name: "Roles", value: roles_strings.join("\n"), inline: true });
    if (colors_strings.length > 0) fields.push({ name: "Colors", value: colors_strings.join("\n"), inline: true });

    let embed = u.embed({ title: `${interaction.member.displayName}'s Inventory` })
      .addFields(fields);
    return embed;
  }
}

async function inventory_select_menus(interaction, inventory, member_roles_cache) {
  if (!member_roles_cache) {
    let freshMember = await interaction.member.fetch(true);
    member_roles_cache = freshMember.roles.cache;
  }
  inventory = inventory || await User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
  if (inventory.length == 0) {
    return null; // No select menu if inventory is empty
  } else {
    //split inventory into colors and roles
    let roles = inventory.filter(item => !item.is_color);
    let colors = inventory.filter(item => item.is_color);
    let selectMenus = [];
    if (roles.length > 0) {
      selectMenus.push(new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId(`InventoryRoleSelect`)
          .setPlaceholder("Select your roles") //roles can be multiple select, colors can only be single select, and will start selected on the currently held color and roles if applicable
          .addOptions(roles.map(item => {
            let hasRole = member_roles_cache.has(item.granted_role_snowflake);
            return {
              label: interaction.guild.roles.cache.get(item.granted_role_snowflake)?.name || "Unknown Role",
              value: `role_${item.id}`,
              default: hasRole
            }
          })).setMaxValues(roles.length).setMinValues(0)
      ));
    }
    if (colors.length > 0) {
      selectMenus.push(new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId(`InventoryColorSelect`)
          .setPlaceholder("Select a color")
          .addOptions(colors.map(item => {
            let hasColor = member_roles_cache.has(item.granted_role_snowflake);
            return {
              label: interaction.guild.roles.cache.get(item.granted_role_snowflake)?.name || "Unknown Color",
              value: `color_${item.id}`,
              default: hasColor
            }
          })).setMaxValues(1).setMinValues(0)
      ));
    }
    return selectMenus;
  }
}
Module.addInteractionCommand({
  name: "inventory",
  process: async (interaction) => {
    await interaction.deferReply();
    let freshMember = await interaction.member.fetch(true);
    let member_roles_cache = freshMember.roles.cache;
    let inventory = await User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
    let embed = await inventory_embed(interaction, inventory, member_roles_cache);
    await interaction.editReply({ embeds: [embed] });
    //prevent other people from using the select menu by making it ephemeral
    await interaction.followUp({ content: "Use the select menu below to manage your roles and colors!", components: await inventory_select_menus(interaction, inventory, member_roles_cache), ephemeral: true });
  }
})
  .addInteractionHandler({
    customId: `InventoryRoleSelect`, process: async (interaction) => {
      await interaction.deferUpdate();
      let freshMember = await interaction.member.fetch(true);
      let member_roles_cache = freshMember.roles.cache;
      let inventory = await User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
      let selectedRoleIds = interaction.values.map(value => parseInt(value.split("_")[1]));
      let selectedItems = inventory.filter(item => !item.is_color && selectedRoleIds.includes(item.id));
      let unselectedItems = inventory.filter(item => !item.is_color && !selectedRoleIds.includes(item.id));
      let rolesToAdd = selectedItems.filter(item => !member_roles_cache.has(item.granted_role_snowflake)).map(item => item.granted_role_snowflake);
      let rolesToRemove = unselectedItems.filter(item => member_roles_cache.has(item.granted_role_snowflake)).map(item => item.granted_role_snowflake);
      await interaction.member.roles.add(rolesToAdd);
      await interaction.member.roles.remove(rolesToRemove);
      let freshMember = await interaction.member.fetch(true);
      let member_roles_cache = freshMember.roles.cache; //refetch roles to update cache
      let newSelectMenus = await inventory_select_menus(interaction, inventory, member_roles_cache);
      await interaction.editReply({ content: "Your roles have been updated!", embeds: [], components: newSelectMenus, ephemeral: true });
    }
  })
  .addInteractionHandler({
    customId: `InventoryColorSelect`, process: async (interaction) => {
      await interaction.deferUpdate();
      let freshMember = await interaction.member.fetch(true);
      let member_roles_cache = freshMember.roles.cache;
      let inventory = await User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
      // Remove existing colors
      let colorsToRemove = inventory.filter(item => item.is_color && member_roles_cache.has(item.granted_role_snowflake)).map(item => item.granted_role_snowflake);
      if (colorsToRemove.length > 0) {
        await interaction.member.roles.remove(colorsToRemove);
      }
      if (interaction.values.length > 0) {
        let selectedColorId = parseInt(interaction.values[0].split("_")[1]);
        let selectedItem = inventory.find(item => item.is_color && item.id === selectedColorId);

        if (selectedItem && !member_roles_cache.has(selectedItem.granted_role_snowflake)) {
          await interaction.member.roles.add(selectedItem.granted_role_snowflake);
        }
      }

      let freshMember = await interaction.member.fetch(true);
      let member_roles_cache = freshMember.roles.cache;
      let newSelectMenus = await inventory_select_menus(interaction, inventory, member_roles_cache);
      await interaction.editReply({ content: "Your color has been updated!", embeds: [], components: newSelectMenus, ephemeral: true });
    }
  })



module.exports = Module;

