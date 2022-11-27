const Module = new (require("augurbot")).Module;
const roleUtilities = require("../utils/Utils.RoleInventory");
const u = require("../utils/Utils.Generic");
const snowflakes = require("../config/snowflakes.json");


Module.addInteractionCommand({
  name: "inventory",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    interaction.deferReply();
    let memberColors = await roleUtilities.getMemberColorInventory(interaction.member);
    //let memberSecondary = await roleUtilities.getSecondaryInventory(interaction.member);
    let memberColorString = memberColors.map(c => `<@&${c}>` + (interaction.member.roles.cache.has(c) ? " ✅" : "")).join("\n");
    //let memberSecondaryString = memberSecondary.map(c => `<@&${c}>` + (interaction.member.roles.cache.has(c) ? " ✅" : "")).join("\n");
    let embed = u.embed()
      .setTitle(interaction.member.displayName + "'s inventory")
      .setDescription(`__**Equipable Colors:**__\n${memberColorString}`);
    interaction.editReply({ embeds: [embed] });
  }
})


module.exports = Module;

