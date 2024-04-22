const wiki = require("../utils/Utils.Wiki.js");
const Augur = require("augurbot");
const Module = new Augur.Module();
const snowflakes = require('../config/snowflakes.json');
const u = require('../utils/Utils.Generic');
const fs = require('fs');
const MessageActionRow = require("discord.js").MessageActionRow;
const MessageButton = require("discord.js").MessageButton;


const SPIRES = ["Hydra", "Phoenix ", "Serpent", "Tiger", "Tortoise"].map(f => f.toLowerCase());

/**
 * A class to represent a Judgement Request
 * @class
 */
class JudgementRequest {
  requester;
  desiredSpire = SPIRES[Math.floor(Math.random() * SPIRES.length)];
  /**
   * @constructor
   * @param {string} requester - The user who requested the judgement
   * @param {string} desiredSpire - The spire the requester wants visit.
   */
  constructor(requester, spire) {
    if ((SPIRES.indexOf(spire.toLowerCase().trim()) > -1) || spire.toLowerCase() == "random") {
      this.requester = requester;
      this.desiredSpire = spire || SPIRES[Math.floor(Math.random() * SPIRES.length)];
    } else {
      throw new Error("Invalid Spire");
    }
  }
  /**
   * @returns {string} - A string representation of the Judgement Request
   */
  toString() {
    return `Requester: ${this.requester}, Desired Spire: ${this.desiredSpire}`;
  }

  /**
   * @param {Discord.Guild} guild - The guild to get the user string for
   * @returns {string} - A string representation of the username and requested spire of the Judgement Request
   */
  toUserString(guild) {
    //get the displayname from cache, or fetch if not available in the cache
    let displayName = guild.members.cache.get(this.requester)?.displayName || '<@' + this.requester + '>';
    return `${displayName} - ${this.desiredSpire}`;
  }
  /**
   * 
   * @returns {Object} - A JSON representation of the Judgement Request
   */
  toJSON() {
    return {
      requester: this.requester,
      desiredSpire: this.desiredSpire
    }
  }
}


let lastRequests = [];


const Command = {
  name: "judgement",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    const requests = JSON.parse(fs.readFileSync('./data/judgement/requests.json')).map(req => new JudgementRequest(req.requester, req.desiredSpire));
    //there will be three sub commands, request, view, and judge. Request will allow a person to be added to the list, get will get three random people from the list, and allow a voice of the tower to remove them from the list
    switch (interaction.options.getSubcommand()) {

      case "request":
        //determine if there is already a request for the user in './data/judgement/requests.json'
        //if there is, inform the user that they already have a request in
        //if there isn't, create a new request object and add it to the list
        //inform the user that their request has been added
        const requester = interaction.user;
        const spire = interaction.options.getString("spire");
        const request = new JudgementRequest(requester.id, spire);
        console.log(request.toString());

        if (requests.find(req => req.requester == requester)) {
          interaction.reply({ content: "You already have a request in.", ephemeral: true });
        } else {
          requests.push(request);
          fs.writeFileSync('./data/judgement/requests.json', JSON.stringify(requests.map(req => req.toJSON())));
          interaction.reply({ content: "Your Judgement request for " + spire + " has been added to my memory crystals! \nJudgements will be run as our voices of the tower have time, and canditates will be selected at random. Candidates are usually selected in groups of three, with the first to respond being judged, so please have pings for the server enabled!\n Note: If you decide you want to do a different spire at the time of judgement, that is totally okay.", ephemeral: true });
        }
        break;
      //get the spire they want to visit
      //add them to the list

      case "view":
        //get the first hundred requests from the list, limited to 1900 characters
        //display them to the user
        //if there are no requests, inform the user that there are no requests
        //inform the user if they are on the list

        let requestString = requests.slice(0, 100).map((req, index) => (index + 1) + ": " + req.toUserString(interaction.guild)).join("\n");
        if (requestString == "") {
          requestString = "There are no requests at this time.";
        } else if (requestString.length > 1900) {
          requestString = "";
          //get the first x number of requests that doesn't exceed 1900 characters
          let i = 0;
          while (requestString.length < 1900 && i < requests.length) {
            requestString += requests[i].toUserString(interaction.guild) + "\n";
            i++;
          }
          //if the user has a request in, respond with that information
          if (requests.find(req => req.requester == interaction.user.id)) {
            requestString += "\n\nYou are on the list!";
          }
        }

        interaction.reply({
          content: "Here are the current Judgement Requests: \n" + requestString,
          ephemeral: true
        })
        break;
      case "judge": //this will be a voice of the tower only command
        //get three random requests from the list
        //display them to the user
        //add a button to remove each request from the list
        //if there are no requests, inform the user that there are no requests

        let AllowedToJudge = interaction.member.roles.cache.find(role => role.name.toLowerCase() == "voice of the tower" || interaction.member.permissions.has("ADMINISTRATOR") || interaction.member.roles.cache.get(snowflakes.roles.BotMaster));
        if (!AllowedToJudge) {
          interaction.reply({ content: "You do not have permission to judge requests.", ephemeral: true });
          return;
        } else {
          //get three random requests, ensure they are unique, and have not been gotten in the last 10 requests
          let selectedRequests = [];
          let i = 0;
          while (i < 3 && i < requests.length) {
            let request = requests[Math.floor(Math.random() * requests.length)];
            if (!selectedRequests.includes(request) && !lastRequests.includes(request)) {
              selectedRequests.push(request);
              lastRequests.push(request);
              i++;
            }
          }
          if (lastRequests.length > 10) {
            lastRequests.shift();
          }

          let components = [];
          for (const request of selectedRequests) {
            let row = new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setCustomId('removeJudgementRequest')
                  .setLabel('Remove ' + interaction.guild.members.cache.get(request.requester).displayName)
                  .setStyle('DANGER')
                  .setDisabled(false)
              );
            components.push(row);
          }
          //display the requests to the user
          let requestString = selectedRequests.map(req => req.toUserString(interaction.guild)).join("\n");
          if (requestString == "") {
            requestString = "There are no requests at this time.";
          }
          interaction.reply({
            content: "Here are the three random judgement requests: \n" + requestString,
            ephemeral: true,
            components: components
          })
        }
        break;
    }
  }
}


Module.addInteractionCommand(Command)
  .addInteractionHandler({
    customId: `removeJudgementRequest`, process: async (interaction) => {
      const requests = JSON.parse(fs.readFileSync('./data/judgement/requests.json'));
      //remove the request from the list
      const requestName = interaction.component.label.toLowerCase().replace("remove ", "")
      const requester = requests.find(req => interaction.guild.members.cache.get(req.requester).displayName == requestName).requester;
      const index = requests.findIndex(req => req.requester == requester);
      if (index > -1) {
        requests.splice(index, 1);
        fs.writeFileSync('./data/judgement/requests.json', JSON.stringify(requests));
        interaction.reply({ content: "Request removed", ephemeral: true });
      } else {
        interaction.reply({ content: "Request not found", ephemeral: true });
      }
    }
  });


/* JSON for registering the command:
{
"name": "judgement",
"description": "Request a judgement from the Voices of the Tower",
"options": [
  {
    "name": "request",
    "description": "Request a judgement",
    "type": 1,
    "options": [
      {
        "name": "spire",
        "description": "The spire you wish to visit",
        "type": 3,
        "required": true,
        "choices": [
          {
            "name": "Hydra",
            "value": "Hydra"
          },
          {
            "name": "Phoenix ",
            "value": "Phoenix "
          },
          {
            "name": "Serpent",
            "value": "Serpent"
          },
          {
            "name": "Tiger",
            "value": "Tiger"
          },
          {
            "name": "Tortoise",
            "value": "Tortoise"
          },
          {
            "name": "Random",
            "value": "Random"
          }
        ]
      }
    ]
  },
  {
    "name": "view",
    "description": "View the current Judgement Requests",
    "type": 1
  },
  {
    "name": "judge",
    "description": "Judge the current Judgement Requests",
    "type": 1
  }
]
*/

module.exports = Module;