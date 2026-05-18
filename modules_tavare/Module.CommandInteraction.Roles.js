const Module = new (require("augurbot")).Module;
const roleUtilities = require("../utils/Utils.RoleInventory.js");
const u = require("../utils/Utils.Generic.js");
const { MessageActionRow, MessageSelectMenu } = require("discord.js");
const create_rolesClient = require("../utils/Utils.RolesLogin.js");




function roleMessageComponents(interaction, memberColors) {
  let SelectMenuOptions = [];
  //buildSelectMenu
  for (const role of memberColors) {
    let name = interaction.guild.roles.cache.get(role).name
    SelectMenuOptions.push({
      label: name,
      description: `The ${name} role`,
      value: role,
    })
  }
  SelectMenuOptions.push({
    label: "Random",
    description: `A Random color`,
    value: "Random",
  })
  let rows = []
  const row = new MessageActionRow()
    .addComponents(
      new MessageSelectMenu()
        .setCustomId('InventoryRoleSelect')
        .setPlaceholder('Nothing    selected')
        .addOptions(SelectMenuOptions),
    );
  rows.push(row);
  return rows;
}
async function inventoryEmbed(interaction, memberColors) {
  memberColors = memberColors || await roleUtilities.getMemberColorInventory(Module, interaction.member);
  let memberColorString = memberColors.map(c => `<@&${c}>` + (interaction.member.roles.cache.has(c) ? " ✅" : "")).join("\n");
  let embed = u.embed()
    .setTitle(interaction.member.displayName + "'s inventory")
    .setDescription(`__**Equipable Colors:**__\n${memberColorString}`);
  return embed;
}


Module.addInteractionCommand({
  name: "inventory",
  process: async (interaction) => {
    interaction.deferReply();
    let memberColors = await roleUtilities.getMemberColorInventory(Module, interaction.member);
    let embed = await inventoryEmbed(interaction, memberColors);
    await interaction.editReply({ embeds: [embed] });
    interaction.followUp({ content: "Select your role", components: roleMessageComponents(interaction, memberColors), ephemeral: true })
  }
})
  .addInteractionHandler({
    customId: `InventoryRoleSelect`, process: async (interaction) => {
      interaction.deferReply?.({ ephemeral: true });
      let memberColors = await roleUtilities.getMemberColorInventory(Module, interaction.member);
      let color;
      if (interaction.values[0].toLowerCase().indexOf("random") > -1) color = await interaction.guild.roles.cache.get(`${memberColors[Math.floor(Math.random() * memberColors.length)]}`);
      else color = await interaction.guild.roles.cache.get(`${interaction.values[0]}`);
      console.log(color.id);
      let member = interaction.member;
      await member.roles.remove(memberColors);
      await member.roles.add(color)
      await interaction.editReply({ content: "You have successfully selected a role", ephemeral: true })
    }
  })

module.exports = Module;

