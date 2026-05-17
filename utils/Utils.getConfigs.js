let config = require("../config/config.json");
let snowflakes = require("../config/snowflakes.json");
let anathemaConfig = require("../config/config_anathema.json");
let anathemaSnowflakes = require("../config/snowflakes_anathema.json");

const valid_bot_names = ["Tavare", "Anathema"];

function getConfigs(botName) {
  if (botName && !valid_bot_names.includes(botName)) {
    throw new Error(`Invalid bot name provided: ${botName}. Valid options are: ${valid_bot_names.join(", ")}`);
  }
  if (botName === "Anathema") {
    return { config: anathemaConfig, snowflakes: anathemaSnowflakes };
  } else {
    return { config, snowflakes };
  }
}


module.exports = {
  getConfigs: getConfigs,
  config: config,
  snowflakes: snowflakes,
  anathemaConfig: anathemaConfig,
  anathemaSnowflakes: anathemaSnowflakes,
  valid_bot_names: valid_bot_names
};