const Augur = require("augurbot");
const u = require("../utils/Utils.Generic");
const axios = require("axios").default;
const snowflakes = require('../config/snowflakes.json');
const config = require("../config/config.json");


const Module = new Augur.Module().addInteractionCommand({
    name: "fema",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      return interaction.reply({ content: `If you or a friend is in the path of Hurrican Milton, please see the following link for resources https://www.fema.gov/disaster/current/hurricane-milton`, ephemeral: true })
    }

  });

module.exports=Module;
  
