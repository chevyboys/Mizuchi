const Augur = require("augurbot"),
  Discord = require("discord.js"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic");

//a function for making the discord slash command options object more readable
function optionsToString(options, spacing = true, depth = 1,) {
  if (!options) return "";
  let optionsString = "";
  let depthString = "";
  for (let i = 0; i < depth; i++) {
    depthString += "--";
  }
  for (let option of options) {
    optionsString += (spacing ? (`\n` + depthString) : "") + `**${option.name}**${option.value ? `: ${option.value}` : ""}${option.options ? " with options:" : ""}`;
    if (option.options?.length > 0) optionsString += optionsToString(option.options, spacing, depth + 1);
  }
  return optionsString;
}

let commandStats = {};

//each time an interaction command is used, log the user, command name, time, and command options
async function logInteraction(interaction) {
  //if the interaction is a component interaction, log it as a component interaction
  if (interaction.isButton() || interaction.isSelectMenu()) {

    let time = new Date();
    console.log(`User: ${interaction.member} used component interaction: ${interaction.customId} at ${time}`);
    //also log it to the u.errorLog webhood
    let webhook = u.errorLog;
    let embed = new Discord.MessageEmbed()
      .setTitle(`${interaction.member.displayName} used component interaction: ${interaction.customId}`)
      .setDescription(`Label: ${interaction.component.label}\nTime: ${time.toISOString()}\n Guild: ${interaction.guild.name}\n Channel: ${interaction.channel.name}\n Ephemeris: ${interaction.ephemeral}\n Interaction ID: ${interaction.id}\n\n messageLink: [click here](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${interaction.message.id})`)
      .setColor("#e0c2ff");
    webhook.send({ embeds: [embed] });
    return;
  }
  try {
    let command = interaction.commandName;
    //if the command is a subcommand, add the subcommand name to the command name
    if (interaction.options?.getSubcommand()) {
      command += ` ${interaction.options.getSubcommand()}`;
    }
    let time = new Date();
    let options = interaction.options?.data;
    //if the command is a subcommand, remove the subcommand options from the options object
    if (interaction.options?.getSubcommand()) {
      options = interaction.options.data[0].options;
    }
    console.log(`User: ${interaction.member} used command: ${command} at ${time} with options: ${optionsToString(options)}`);

    //also log it to the u.errorLog webhood
    let webhook = u.errorLog;
    let embed = new Discord.MessageEmbed()
      .setTitle(`${interaction.member.displayName} used ${command}`)
      .setDescription(`options: ${optionsToString(options)}\nTime: ${time.toISOString()}\n Guild: ${interaction.guild.name}\n Channel: ${interaction.channel.name}\n Ephemeris: ${interaction.ephemeral}\n Interaction ID: ${interaction.id}\n Command ID: ${interaction.commandId}\n\n copy-pasteable command: \`</${command}:${interaction.commandId}>\``)
      .setColor("#e0c2ff")
      .setFooter(`User ID: ${interaction.member.id}, Command ${commandStats[command] ? `used ${commandStats[command].uses} times used by ${commandStats[command].users.length} users` : "not used before"}`);
    webhook.send({ embeds: [embed] });

    //store basic information about the interaction in commandStats, so we can see which commands are being used most frequently, and the number of unique users who have used each command

    if (commandStats[command]) {
      commandStats[command].uses++;
      if (!commandStats[command].users.includes(interaction.member.id)) {
        commandStats[command].users.push(interaction.member.id);
      }
    } else {
      commandStats[command] = { uses: 1, users: [interaction.member.id] };
    }
  } catch (error) {
    console.error(`Error logging interaction: ${error}`);
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