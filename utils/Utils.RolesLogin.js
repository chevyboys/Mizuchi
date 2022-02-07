const { Client, Intents } = require('discord.js');
  config = require("../config/config.json"),
  u = require("./Utils.Generic");

let token = config.auxToken;

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

// Login to Discord with your client's token
client.login(token);
module.exports = client;
