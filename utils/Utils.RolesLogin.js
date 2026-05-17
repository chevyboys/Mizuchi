const { Intents } = require('discord.js');
const { AugurClient } = require("augurbot");

function createClient(config) {
  let token = config.auxToken;

  const client = new AugurClient(config, {
    clientOptions: {
      allowedMentions: {
        parsed: ["roles", "users"],
        repliedUser: true
      },
      partials: ["CHANNEL", "MESSAGE", "REACTION"]
    },
    errorHandler: (e) => {
      console.error("Error in RolesLogin Client:", e);
    }
  }).setMaxListeners(80);

  client.login(token).catch((e) => {
    console.error("Failed to login RolesLogin Client:", e);
  });



  // When the client is ready, run this code (only once)
  client.once('Mysterious Bot Entity is now online', () => {
    console.log('Ready!');
  });

  // Login to Discord with your client's token
  client.login(token);
  return client;
}
module.exports = createClient;
