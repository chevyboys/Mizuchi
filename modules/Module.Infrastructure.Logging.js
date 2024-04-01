const Augur = require("augurbot"),
  Discord = require("discord.js"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic");

//a function for making the discord slash command options object more readable
function optionsToString(options) {
  let optionsString = "";
  for (let option of options) {
    optionsString += `${option.name}: ${option.value}\n`;
  }
  return optionsString;
}

let commandStats = {};

//each time an interaction command is used, log the user, command name, time, and command options
async function logInteraction(interaction) {
  try {
    let command = interaction.commandName;
    let user = interaction.user;
    let time = new Date();
    let options = interaction.options;
    console.log(`User: ${user.username}#${user.discriminator} used command: ${command} at ${time} with options: ${options}`);
  } catch (error) {
    console.error(`Error logging interaction: ${error}`);
  }
  //also log it to the u.errorLog webhood
  let webhook = u.errorLog;
  let embed = new Discord.MessageEmbed()
    .setTitle("Interaction Command Used")
    .setDescription(`User: ${user.username}#${user.discriminator} used command: ${command} at ${time} with options: ${optionsToString(options)}`)
    .setColor("#e0c2ff");
  webhook.send({ embeds: [embed] });

  //store basic information about the interaction in commandStats, so we can see which commands are being used most frequently, and the number of unique users who have used each command

  if (commandStats[command]) {
    commandStats[command].uses++;
    if (!commandStats[command].users.includes(user.id)) {
      commandStats[command].users.push(user.id);
    }
  } else {
    commandStats[command] = { uses: 1, users: [user.id] };
  }
}

//event hook on the module for logging each command interaction
Module.addEvent("interactionCreate", logInteraction);
//a text command for seeing what interaction commands have been used, sorted by how many times they have been used, with statistics
Module.addCommand({
  name: "commandstats", process: async (msg) => {
    let statsString = "";
    let sortedCommands = Object.entries(commandStats).sort((a, b) => b[1].uses - a[1].uses);
    for (let command of sortedCommands) {
      statsString += `${command[0]}: ${command[1].uses} uses by ${command[1].users.length} users\n`;
    }
    msg.channel.send(statsString);
  }
});

module.exports = Module;