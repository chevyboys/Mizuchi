const fileToRegister = "guildlock.json" //the name of the file in ./registry to use
const clientID = "892508150773723166";
const guildID = "485503617067909120";


const apiEndpoint = `https://discord.com/api/v8/applications/${clientID}/guilds/${guildID}/commands`;
const botToken = require("./config/config.json").token;

const commandData = require(`./registry/${fileToRegister}`);

async function main () {
  const fetch = require('node-fetch')

  const response = await fetch(apiEndpoint, {
    method: 'post',
    body: JSON.stringify(commandData),
    headers: {
      'Authorization': 'Bot ' + botToken,
      'Content-Type': 'application/json'
    }
  })
  const json = await response.json()

  console.log(json)
}
main();