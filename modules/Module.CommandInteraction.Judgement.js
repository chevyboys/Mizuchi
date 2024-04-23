// This module is the controller for the judgement command
const Augur = require("augurbot");
const Module = new Augur.Module();
const snowflakes = require('../config/snowflakes.json');
const u = require('../utils/Utils.Generic');
const { JudgementRequestManager, JudgementRequestStatus, JudgementRequest } = require("./Judgement/JudgementRequestManager.js");
const { MessageSelectMenu } = require("discord.js");
const MessageActionRow = require("discord.js").MessageActionRow;
const MessageButton = require("discord.js").MessageButton;


let lastRequests = [];
const requests = new JudgementRequestManager();



//button component to remove the request of the person pushing the button
let removeRequestButton = new MessageButton()
  .setCustomId('removeSelfJudgementRequest')
  .setLabel('Remove My Request')
  .setStyle('DANGER')
  .setDisabled(false);

function removeRequestButtonForUser(guildMember) {
  return new MessageButton()
    .setCustomId('removeJudgementRequest' + guildMember.id)
    .setLabel('Remove ' + guildMember.displayName)
    .setStyle('DANGER')
    .setDisabled(false)
}

let IsAllowedToJudge = (interaction) => interaction.member.roles.cache.find(role => role.name.toLowerCase() == "voice of the tower"
  || interaction.member.permissions.has("ADMINISTRATOR")
  || interaction.member.roles.cache.get(snowflakes.roles.BotMaster));

function isAllowedToBeJudged(member) {
  //anyone with the status of on hold cannot be judged
  try {
    return requests.get(member.id).status != JudgementRequestStatus.hold;
  }
  catch (e) {
    u.errorLog.send({ content: "Error in isAllowedToBeJudged: " + e });
    return false;
  }
}



const Command = {
  name: "judgement",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {

    let statusRow = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('adminJudgementRequestStatus')
          .setPlaceholder('Select a status')
          .addOptions([
            { label: 'Queued', value: JudgementRequestStatus.queued },
            { label: 'Hold', value: JudgementRequestStatus.hold },
          ])
      );
    let spireRow = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('adminJudgementRequestSpire')
          .setPlaceholder('Select a spire')
          .addOptions([
            { label: 'Hydra', value: 'Hydra' },
            { label: 'Phoenix', value: 'Phoenix' },
            { label: 'Serpent', value: 'Serpent' },
            { label: 'Tiger', value: 'Tiger' },
            { label: 'Tortoise', value: 'Tortoise' },
            { label: 'Random', value: 'Random' }
          ])
      );

    //there will be three sub commands, request, view, and judge. Request will allow a person to be added to the list, get will get three random people from the list, and allow a voice of the tower to remove them from the list
    switch (interaction.options.getSubcommand()) {

      case "request":
        //determine if there is already a request for the user in './data/judgement/requests.json'
        //if there is, inform the user that they already have a request in
        //if there isn't, create a new request object and add it to the list
        //inform the user that their request has been added
        const requester = interaction.user;
        const spire = interaction.options.getString("spire");
        const request = new JudgementRequest(requester.id, spire, JudgementRequestStatus.queued);
        console.log(request.toString());
        if (spire.toLowerCase() == "spider") {
          interaction.reply({ content: "No : )", ephemeral: true });
          return;
        }

        if (requests.has(requester.id)) {
          interaction.reply({ content: "You already have a request in. Press the button below if you wish to remove your request", ephemeral: true, components: [spireRow, new MessageActionRow().addComponents(removeRequestButton)] });
        } else {
          requests.add(requester.id, spire);
          interaction.reply({ content: "Your Judgement request for " + spire + " has been added to my memory crystals! \nJudgements will be run as our voices of the tower have time, and canditates will be selected at random. Candidates are usually selected in groups of three, with the first to respond being judged, so please have pings for the server enabled!\n Note: If you decide you want to do a different spire at the time of judgement, that is totally okay.", ephemeral: true });
        }
        break;
      case "view":
        //get the first hundred requests from the list, limited to 1900 characters
        //display them to the user
        //if there are no requests, inform the user that there are no requests
        //inform the user if they are on the list
        let components = [];
        let requestString = requests.requests.slice(0, 100).map(
          (req, index) =>
            (index + 1) + ": "
            + req.toUserString(interaction.guild)
            + (IsAllowedToJudge(interaction) ? (" - " + req.status) : "")
        ).join("\n");
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
            components.push(new MessageActionRow().addComponents(removeRequestButton));
          }
        }

        interaction.reply({
          content: "Here are the current Judgement Requests: \n" + requestString,
          ephemeral: true,
          components: components
        })
        break;
      case "select": //this will be a voice of the tower only command
        //get three random requests from the list
        //display them to the user
        //add a button to remove each request from the list
        //if there are no requests, inform the user that there are no requests
        if (!IsAllowedToJudge(interaction)) {
          interaction.reply({ content: "You do not have permission to judge requests.", ephemeral: true });
          return;
        } else {
          //get three random requests, ensure they are unique, and have not been gotten in the last 10 requests
          let selectedRequests = [];
          let i = 0;
          let loopCount = 0;
          if (requests.requests.length < 10) {
            lastRequests = [];
          }
          while (i < 3 && i < requests.requests.length && loopCount < 15) {
            loopCount++;
            let request = requests.requests[Math.floor(Math.random() * requests.requests.length)];
            if (!selectedRequests.includes(request) && !lastRequests.includes(request) && isAllowedToBeJudged(interaction.guild.members.cache.get(request.requester))) {
              selectedRequests.push(request);
              if (requests.requests.length > 10) lastRequests.push(request);
              i++;
            }
          }
          if (lastRequests.length > 10) {
            lastRequests.shift();
          }

          let components = [];
          let row = new MessageActionRow()
          for (const request of selectedRequests) {
            row.addComponents(
              removeRequestButtonForUser(interaction.guild.members.cache.get(request.requester))
            );
          }
          components.push(row);
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
      case "judge":
        //the code for this command cannot be included here due to NDAs
        //this command will be used to score the requests that are selected, attach the role to users, and save the results to a file
        //look for a judgement folder in the modules folder this file is in. If it exists, import the file titled score.js
        //run the score function in the file, passing in the selected requests
        //if the score function returns a string, send that string as a message
        //if the score function returns an embed, send that embed as a message
        //if the score function returns a message, send that message as a message

        try {
          try {
            let score = require('./judgement/score.js')
          } catch (e) {
            interaction.reply({ content: "No score function found", ephemeral: true });
            return;
          }
          score(interaction, requests);
          //all replies will be handled in the score function
        } catch (e) {
          interaction.reply({ content: "There was an error scoring the judgement", ephemeral: true });
        }
        break;
      case "remove":
        //remove the request from the list
        const target = interaction.options.getMember("user");
        if (!IsAllowedToJudge(interaction)) {
          interaction.reply({ content: "You do not have permission to remove requests except your own.", ephemeral: true, components: [new MessageActionRow().addComponents(removeRequestButton)] });
          return;
        }

        if (target) {
          try {
            requests.remove(target.id);
            interaction.reply({ content: "Request removed", ephemeral: true });
          } catch (e) {
            interaction.reply({ content: "Request not found", ephemeral: true });
          }
        } else {
          interaction.reply({ content: "User not found", ephemeral: true });
        }
        break;
      case "admin":
        //sends and ephemeral message to the user with the admin console
        //there will be an autocomplete portion of the command that will allow the user to select a request from the list, since we will have more requests than a selectMenu can handle
        //the admin console will have an autocomplete option that allows the admin to select a request from the list
        //the admin can then change the status of the request using a string select component, remove the request with a button, update the spire using a string select.
        if (!IsAllowedToJudge(interaction)) {
          interaction.reply({ content: "You do not have permission to access the admin console.", ephemeral: true });
          return;
        } else {


          let targetRequestOption = interaction.options.get("request").value;
          if (!targetRequestOption || targetRequestOption == "") {
            return interaction.reply({ content: "invalid request", ephemeral: true });
          }
          let targetRequest = requests.requests.find(r => r.toUserString(interaction.guild) == targetRequestOption);
          if (!targetRequest) {
            return interaction.reply({ content: "No request found", ephemeral: true });
          }
          //TODO: find the request shown in the target request from the requests list
          interaction.reply(
            {
              content: "Admin Options for ```" + targetRequest.toUserString(interaction.guild) + " - " + targetRequest.status + "```",
              ephemeral: true,
              components: [
                spireRow,
                statusRow,
                new MessageActionRow().addComponents(removeRequestButtonForUser(interaction.guild.members.cache.get(targetRequest.requester)))
              ]
            });
        }
        break;
    }
  }
}


Module.addInteractionCommand(Command)
  .addInteractionHandler({
    customId: `removeSelfJudgementRequest`, process: async (interaction) => {
      const requester = interaction.user.id;
      try {
        requests.remove(requester);
        interaction.reply({ content: "Your request was removed", ephemeral: true });
      } catch (e) {
        interaction.reply({ content: "You don't seem to have a request in my memory crystals", ephemeral: true });
      }
    }
  }).addEvent("interactionCreate", async (interaction) => {
    // handle anything that starts with customId: `removeJudgementRequest`, and process it
    if (!interaction.isButton() || !interaction.customId.startsWith("removeJudgementRequest")) return;
    //remove the request from the list
    const targetId = interaction.customId.toLowerCase().replace("removejudgementrequest", "")
    if (targetId) {
      try {
        requests.remove(targetId);
        interaction.reply({ content: "Request removed", ephemeral: true });
      } catch (e) {
        interaction.reply({ content: "Request not found", ephemeral: true });
      }
    } else {
      interaction.reply({ content: "User not found", ephemeral: true });
    }



  }).addEvent("interactionCreate", async (interaction) => {
    if (!interaction.isAutocomplete() || interaction.commandName != "judgement" || !interaction.options.getSubcommand() == "admin") return;
    if (!IsAllowedToJudge(interaction)) {
      return await interaction.respond([{ name: "Permission Denied", value: "permission denied" }]);
    }
    const focusedValue = interaction.options.getFocused();
    let pages = u.smartSearchSort(requests.requests.map(r => r.toUserString(interaction.guild)), focusedValue)
    if (pages.length == 0) return interaction.respond([{ name: "Unknown", value: "unknown" }]);
    await interaction.respond(
      pages.map(page => ({ name: page, value: page }))
    );

  })
  .addInteractionHandler({
    customId: `adminJudgementRequestStatus`, process: async (interaction) => {
      //change the status of the request
      //search each row to find the remove button
      let removeButton =
        interaction.message.components.find(row =>
          row.components.find(component =>
            component.customId.startsWith("removeJudgementRequest"))
        )?.components.find(component =>
          component.customId.startsWith("removeJudgementRequest"))
        || interaction.message.components.find(row => row.components.find(component => component.customId == "removeSelfJudgementRequest")).components.find(component => component.customId == "removeSelfJudgementRequest");
      const targetId = removeButton.customId.replace("removeJudgementRequest", "");
      const targetRequest = requests.get(targetId);
      if (!targetRequest) {
        return interaction.reply({ content: "No request found", ephemeral: true });
      }
      const status = interaction.values[0];
      requests.setStatus(targetRequest.requester, status);
      return interaction.update({ content: "Admin Options for ```" + targetRequest.toUserString(interaction.guild) + " - " + targetRequest.status + "```", ephemeral: true });

    }
  })
  .addInteractionHandler({
    customId: `adminJudgementRequestSpire`, process: async (interaction) => {
      //change the spire of the request
      //search each row to find the remove button
      let removeButton =
        interaction.message.components.find(row =>
          row.components.find(component =>
            component.customId.startsWith("removeJudgementRequest"))
        )?.components.find(component =>
          component.customId.startsWith("removeJudgementRequest"))
        || interaction.message.components.find(row => row.components.find(component => component.customId == "removeSelfJudgementRequest")).components.find(component => component.customId == "removeSelfJudgementRequest");
      //find the guild member with the displayname found in the remove button
      const targetRequest = removeButton.customId.startsWith("removeJudgementRequest") ?
        requests.get(interaction.guild.members.cache.get(removeButton.customId.replace("removeJudgementRequest", ""))) :
        requests.get(interaction.user.id);
      if (!targetRequest) {
        return interaction.reply({ content: "No request found", ephemeral: true });
      }
      const spire = interaction.values[0];
      requests.setSpire(targetRequest.requester, spire);

      if (removeButton.customId.startsWith("removeJudgementRequest")) { return interaction.update({ content: "Admin Options for ```" + targetRequest.toUserString(interaction.guild) + " - " + targetRequest.status + "```", ephemeral: true }); }
      else {
        return interaction.update({ content: "Your spire has been updated to " + spire, ephemeral: true });
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
              "name": "Phoenix",
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
      "name": "select",
      "description": "Select candidates for judgement",
      "type": 1
    },
    {
      "name": "remove",
      "description": "Remove a user's judgement request",
      "type": 1,
      "options": [
        {
          "name": "user",
          "description": "The user to remove",
          "type": 6,
          "required": true
        }
      ]
    },
    {
      "name": "judge",
      "description": "Enter a code to calculate a user's attunement",
      "type": 1,
      "options": [
        {
          "name": "code",
          "description": "The comma seperated codes to use for judging",
          "type": 3,
          "required": true
        },
        {
          "name": "user",
          "description": "The user to judge",
          "type": 6,
          "required": true
        },
        {
          "name": "spire",
          "description": "The spire to judge for",
          "type": 3,
          "required": true,
          "choices": [
            {
              "name": "Hydra",
              "value": "Hydra"
            },
            {
              "name": "Phoenix",
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
            }
          ]
        },
        {
          "name": "notes",
          "description": "Any notes to add to the judgement",
          "type": 3
        }
      ]
    },
    {
      "name": "admin",
      "description": "Opens the admin console for the selected request",
      "type": 1
      "options": [
        {
          "name": "request",
          "description": "The request to view",
          "type": 6,
          "required": true,
          "autocomplete": true
        }
      ]
    }
  ]
}
*/

module.exports = Module;