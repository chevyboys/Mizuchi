const Module = new (require("augurbot")).Module;
const u = require("../utils/Utils.Generic.js");
const db = require("../utils/Utils.Database.js");
const { User_Guild_Inventory } = db;
const { MessageActionRow, MessageSelectMenu, CommandInteraction, User } = require("discord.js");


/**
 * Sorts a user's inventory based on the hierarchical position of the granted roles.
 * 
 * @param {Array} inventory - The array of inventory items from User_Guild_Inventory.
 * @param {Discord.Guild} guild - The guild object to fetch role positions from.
 * @returns {Array} The sorted inventory array.
 */
function sort_inventory_by_role_position(inventory, guild) {
  return inventory.sort((a, b) => {
    // Fetch the Discord role objects from the cache using the snowflakes
    let roleA = guild.roles.cache.get(a.granted_role_snowflake);
    let roleB = guild.roles.cache.get(b.granted_role_snowflake);

    // Default to a position of 0 if the role no longer exists in the server
    let positionA = roleA ? roleA.position : 0;
    let positionB = roleB ? roleB.position : 0;

    // Sort descending (highest roles first)
    return positionB - positionA;
  });
}

function inventory_item_embed_string(interaction, item, member_roles_cache = interaction.member.roles.cache) {
  let snowflake = item.granted_role_snowflake;
  if (snowflake) {
    //determine if the person has this role right now
    let hasRole = member_roles_cache.has(snowflake);
    return `<@&${snowflake}> ${hasRole ? "✅" : ""}`;
  }
  return item.toString();
}

function giftable_inventory_embed_string(interaction, item, target_inventory) {
  let snowflake = item.granted_role_snowflake;

  if (snowflake) {
    let targetHasItem = target_inventory.some(targetItem => targetItem.granted_role_snowflake === snowflake);

    if (targetHasItem) {
      return `~~<@&${snowflake}>~~ *(Already owned)*`;
    } else {
      let hasRole = interaction.member.roles.cache.has(snowflake);
      return `<@&${snowflake}>`;
    }
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
    inventory = sort_inventory_by_role_position(inventory, interaction.guild);
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
    inventory = sort_inventory_by_role_position(inventory, interaction.guild);
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
      let selectedColor = colors.find(item => member_roles_cache.has(item.granted_role_snowflake));
      //check if the user currently has more than one color
      if (member_roles_cache.filter(role => colors.some(color => color.granted_role_snowflake == role.id)).size > 1) {
        //if they do, we should treat only the highest role as the currently selected color, and unselect the rest, to avoid confusion
        let highestColor = colors.reduce((highest, color) => {
          let role = interaction.guild.roles.cache.get(color.granted_role_snowflake);
          if (!role) return highest;
          if (!highest) return color;
          let highestRole = interaction.guild.roles.cache.get(highest.granted_role_snowflake);
          if (!highestRole) return color;
          return role.position > highestRole.position ? color : highest;
        }, null);
        selectedColor = highestColor;
      }

      selectMenus.push(new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId(`InventoryColorSelect`)
          .setPlaceholder("Select a color")
          .addOptions(colors.map(item => {
            let isSelected = selectedColor && selectedColor.id === item.id;
            return {
              label: interaction.guild.roles.cache.get(item.granted_role_snowflake)?.name || "Unknown Color",
              value: `color_${item.id}`,
              default: isSelected
            }
          })).setMaxValues(1).setMinValues(0)
      ));
    }
    return selectMenus;
  }
}

async function administrate_inventory(interaction) {
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

async function give_inventory_item_embed(interaction, inventory, target_inventory, can_gift_all = false) {
  inventory = inventory || await User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
  if (!can_gift_all) {
    inventory = inventory.filter(item => item.can_gift);
  }
  let target_name = interaction.options.getUser("recipient")?.username || "the recipient";
  target_inventory = target_inventory || await User_Guild_Inventory.fetch(interaction.options.getUser("recipient").id, interaction.guildId);


  if (inventory.length == 0) {
    await interaction.editReply({ content: `You have no items in your inventory that can be gifted to ${target_name}.`, ephemeral: true });
    return;
  } else {
    inventory = sort_inventory_by_role_position(inventory, interaction.guild);
    let roles_strings = inventory.filter(item => !item.is_color).map(item => giftable_inventory_embed_string(interaction, item, target_inventory, can_gift_all));
    let colors_strings = inventory.filter(item => item.is_color).map(item => giftable_inventory_embed_string(interaction, item, target_inventory, can_gift_all));
    let fields = [];
    if (roles_strings.length > 0) fields.push({ name: "Roles", value: roles_strings.join("\n"), inline: true });
    if (colors_strings.length > 0) fields.push({ name: "Colors", value: colors_strings.join("\n"), inline: true });

    let embed = u.embed({ title: `${interaction.member.displayName}'s Inventory` })
      .addFields(fields);
    return embed;
  }
}

async function give_inventory_item_select_menu(interaction, inventory, target_inventory, can_gift_all = false) {
  inventory = inventory || await User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
  if (!can_gift_all) {
    inventory = inventory.filter(item => item.can_gift);
  }
  target_inventory = target_inventory || await User_Guild_Inventory.fetch(interaction.options.getUser("recipient").id, interaction.guildId);

  let giftable_items_target_does_not_have = [];
  if (!can_gift_all) {
    for (const item of inventory) {
      let targetHasItem = target_inventory.some(targetItem => targetItem.granted_role_snowflake === item.granted_role_snowflake);
      if (!targetHasItem) {
        giftable_items_target_does_not_have.push(item);
      }
    }
  } else {
    giftable_items_target_does_not_have = inventory;
  }

  if (giftable_items_target_does_not_have.length == 0) {
    return null; // No select menu if there are no giftable items that the target doesn't already have
  }

  giftable_items_target_does_not_have = sort_inventory_by_role_position(giftable_items_target_does_not_have, interaction.guild);

  let selectMenu = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId(`GiveInventorySelect`)
      .setPlaceholder("Select an item to gift")
      .addOptions(giftable_items_target_does_not_have.map(item => {
        return {
          label: item.is_color ? `Color: ${interaction.guild.roles.cache.get(item.granted_role_snowflake)?.name || "Unknown Color"}` : `Role: ${interaction.guild.roles.cache.get(item.granted_role_snowflake)?.name || "Unknown Role"}`,
          value: `${item.id}_${interaction.options.getUser("recipient").id}`
        }
      })).setMaxValues(1).setMinValues(1)
  );
  return selectMenu;
}

async function can_administer_inventory(Module, interaction) {
  let admin_roles = [
    Module.config.snowflakes.roles.BotMaster,
    Module.config.snowflakes.roles.BotAssistant,
    Module.config.snowflakes.roles.Admin,
    Module.config.snowflakes.roles.Moderator
  ]
  return interaction.member.roles.cache.some(role => admin_roles.includes(role.id)) || interaction.member.id === Module.config.ownerId;
}


Module.addInteractionCommand({
  name: "inventory",
  process: async (interaction) => {
    //switch for subcommands, default to view if no subcommand is provided
    let subcommand = interaction.options.getSubcommand(false) || "view";
    let freshMember = await interaction.member.fetch(true);
    let member_roles_cache = freshMember.roles.cache;
    let inventory = await User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
    switch (subcommand) {
      case "view":
        await interaction.deferReply();
        let embed = await inventory_embed(interaction, inventory, member_roles_cache);
        await interaction.editReply({ embeds: [embed] });
        //prevent other people from using the select menu by making it ephemeral
        await interaction.followUp({ content: "Use the select menu below to manage your roles and colors!", components: await inventory_select_menus(interaction, inventory, member_roles_cache), ephemeral: true });
        break;
      case "give":
        await interaction.deferReply({ ephemeral: true });
        let targetUser = interaction.options.getUser("recipient");
        let target_inventory = await User_Guild_Inventory.fetch(targetUser.id, interaction.guildId);

        let can_gift_all = await can_administer_inventory(Module, interaction);

        let giveEmbed = await give_inventory_item_embed(interaction, inventory, target_inventory, can_gift_all);
        if (giveEmbed) { // if the embed built successfully and didn't throw the "empty inventory" reply
          let giveMenu = await give_inventory_item_select_menu(interaction, inventory, target_inventory, can_gift_all);
          let components = giveMenu ? [giveMenu] : [];
          await interaction.editReply({ embeds: [giveEmbed], components: components });
        }
        break;
      case "administrate":
        await administrate_inventory(interaction);
        break;
      default:
        await interaction.reply({ content: "Unknown subcommand, please use /inventory view to view your inventory.", ephemeral: true });
    }
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
      freshMember = await interaction.member.fetch(true);
      member_roles_cache = freshMember.roles.cache; //refetch roles to update cache
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

      freshMember = await interaction.member.fetch(true);
      member_roles_cache = freshMember.roles.cache;
      let newSelectMenus = await inventory_select_menus(interaction, inventory, member_roles_cache);
      await interaction.editReply({ content: "Your color has been updated!", embeds: [], components: newSelectMenus, ephemeral: true });
    }
  }).addInteractionHandler({
    customId: `GiveInventorySelect`, process: async (interaction) => {
      await interaction.deferUpdate();

      // Parse the item ID and Recipient ID from the select menu value
      let [itemId, targetId] = interaction.values[0].split("_");

      try {
        // Fetch both the giver's and the recipient's inventories
        let giver_inventory = await User_Guild_Inventory.fetch(interaction.user.id, interaction.guildId);
        let target_inventory = await User_Guild_Inventory.fetch(targetId, interaction.guildId);

        // Find the specific item the user selected from their inventory
        let itemToGive = giver_inventory.find(item => item.id == itemId);

        if (!itemToGive) {
          return await interaction.editReply({
            content: "⚠️ It looks like you no longer have that item in your inventory!",
            embeds: [],
            components: []
          });
        }

        await target_inventory.add(
          {
            granted_role_snowflake: itemToGive.granted_role_snowflake,
            granted_guild_snowflake: itemToGive.granted_guild_snowflake,
            granted_by_user_snowflake: targetId,
            reason_for_award: `Gifted by ${interaction.user.username} InventoryGive`,
            can_gift: false,
            is_color: itemToGive.is_color,
          }
        )

        await interaction.editReply({
          content: `Successfully gave item ${itemId} to <@${targetId}>!`,
          embeds: [],
          components: []
        });
      } catch (error) {
        u.errorHandler(error, interaction);
        await interaction.editReply({
          content: "⚠️ An unexpected error occurred while trying to process the gift.",
          embeds: [],
          components: []
        });
      }
    }
  });

module.exports = Module;