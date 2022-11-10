const Augur = require("augurbot"),
  gs = require("../utils/Utils.GetGoogleSheetsAsJson.js"),
  u = require("../utils/Utils.Generic.js");
const snowflakes = require('../config/snowflakes.json');


const Module = new Augur.Module();
Module.addInteractionCommand({
  name: "character info",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    await interaction.deferReply?.({ ephemeral: false });


    let embed = u.embed().setTitle("Current Climbers Court Staff Members:").setDescription().setColor(color);

    interaction.editReply({ embeds: [embed] });
  }

})