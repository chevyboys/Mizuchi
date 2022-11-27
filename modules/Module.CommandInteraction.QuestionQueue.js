const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  config = require("../config/config.json"),
  snowflakes = require('../config/snowflakes.json');
const fs = require('fs');
const { Message, MessageButton, MessageActionRow, Modal, TextInputComponent } = require('discord.js');
let askedRecently = new Set();

const canAnswerQuestions = interaction => (interaction.member.roles.cache.has(snowflakes.roles.Admin) || interaction.member.roles.cache.has(snowflakes.roles.WorldMaker) || interaction.member.roles.cache.has(snowflakes.roles.BotMaster))

function questionRowButtons(buttonOneStyle, buttonTwoStyle, buttonThreeStyle, buttonTwoEmoji, data) {
  return [
    new MessageActionRow()
      .addComponents(
        //add the upvote button
        new MessageButton()
          .setCustomId('upVoteQuestion')
          .setLabel(``)
          .setStyle(buttonOneStyle || "SECONDARY")
          .setEmoji(snowflakes.emoji.upDawn),

        new MessageButton()
          .setCustomId('voteCheck')
          .setLabel(`${(data.system.IDs.length == 0 || !data.system.IDs.length) ? 1 : data.system.IDs.length}`)
          .setStyle(buttonTwoStyle || "SECONDARY")
          .setEmoji(buttonTwoEmoji || ''),

        //add the check vote status button
        new MessageButton()
          .setCustomId('unvoteQuestion')
          .setLabel("")
          .setStyle(buttonThreeStyle || "SECONDARY")
          .setEmoji(snowflakes.emoji.unDawn),

      ),
    new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("editQuestion")
          .setEmoji("🖊")
          .setStyle("SECONDARY"),

        new MessageButton()
          .setCustomId("deleteQuestion")
          .setEmoji("🗑")
          .setStyle("SECONDARY"),

        new MessageButton()
          .setCustomId("moveQuestion")
          .setEmoji("📤")
          .setStyle("SECONDARY")


      )
  ]
}

async function deleteQuestion(interaction, targetId) {

  // Load data
  let files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
  let rawData = [];
  let asker;
  for (let i = 0; i < files.length; i++) {
    let data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
    if (data.fetch.message == targetId) asker = data.details.asker;
    rawData.push({
      file: files[i],
      fetch: data.fetch,
      string: `<@${data.details.asker}>: ${data.details.question}`,
      votes: data.system.IDs.length
    });
  }
  let target = rawData.find(msg => msg.fetch.message == targetId);
  if (target == undefined) {
    interaction.reply({ content: `There are no questions with that ID in my memory crystals`, ephemeral: true });
    return
  }
  target = [target];
  //permissions check
  if (!interaction.member.roles.cache.has(snowflakes.roles.Admin) && !interaction.member.roles.cache.has(snowflakes.roles.Moderator) && !interaction.member.roles.cache.has(snowflakes.roles.BotMaster) && interaction.user.id != asker) {
    interaction.reply({ content: "Radiance cannot permit you to do that", ephemeral: true });
    return;
  }
  // Check
  if (rawData.length == 0) {
    interaction.reply({ content: `There are no questions to delete! Check back later.`, ephemeral: true });
    return;
  }

  else {
    interaction.reply({ content: `I have removed ${target[0].string ? target[0].string : target[0]}`, ephemeral: true });

    //allow the asker to send again
    if (askedRecently.has(asker)) {
      askedRecently.delete(asker);
    }
  }


  // Delete vote messages
  let c = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.fetch(snowflakes.channels.ask);
  for (let i = 0; i < target.length; i++) {
    fs.unlinkSync(`./data/${target[i].file}`);
    try {
      let m = await c.messages.fetch(target[i].fetch.message);
      if (m) m.delete().catch(() => u.errorHandler(`ERR: Insufficient permissions to delete messages.`));
    } catch (error) {
      if (error.toString().indexOf("Unknown Message") > -1) {
        u.errorHandler("That question has been deleted")
      }
    }
  }


}

if (m) m.delete().catch(err => u.errorHandler(`ERR: Insufficient permissions to delete messages.`));
  }

}

async function moveQuestion(interaction, targetId) {

  // Load data
  let files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
  let rawData = [];
  let asker;
  for (let i = 0; i < files.length; i++) {
    let data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
    if (data.fetch.message == targetId) asker = data.details.asker;
    rawData.push({
      file: files[i],
      fetch: data.fetch,
      string: `<@${data.details.asker}>: ${data.details.question}`,
      votes: data.system.IDs.length
    });
  }
  let target = rawData.find(msg => msg.fetch.message == targetId);
  if (target == undefined) {
    interaction.reply({ content: `There are no questions with that ID in my memory crystals`, ephemeral: true });
    return
  }
  target = [target];
  //permissions check
  if (!interaction.member.roles.cache.has(snowflakes.roles.Admin) && !interaction.member.roles.cache.has(snowflakes.roles.Moderator) && !interaction.member.roles.cache.has(snowflakes.roles.CommunityGuide) && !interaction.member.roles.cache.has(snowflakes.roles.BotMaster) && !interaction.member.roles.cache.has(snowflakes.roles.LARPer) && interaction.user.id != asker) {
    interaction.reply({ content: "Radiance cannot permit you to do that", ephemeral: true });
    return;
  }
  // Check
  if (rawData.length == 0) {
    interaction.reply({ content: `There are no questions to move! Check back later.`, ephemeral: true });
    return;
  }

  //Move to #question-queue    
  interaction.reply({ content: `I have moved ${target[0].string ? target[0].string : target[0]} to the question discussion channel`, ephemeral: true });
  let newResponseChannel = interaction.guild.channels.cache.get(snowflakes.channels.questionDiscussion)
  let newEmbed = interaction.message.embeds[0]
  let components = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('qqaRecycle')//qqa stands for question queue answer
      .setStyle('SECONDARY')
      .setLabel('Return to Question Queue')
  )
  newResponseChannel.send({ content: `<@${asker}>, ${interaction.member.displayName} flagged your question as either already answered, or answerable by the community. They should provide you with more information as a response to this message.`, embeds: [newEmbed], allowedMentions: { parse: ["users"] }, components: [components] })


  //allow the asker to send again
  if (askedRecently.has(asker)) {
    askedRecently.delete(asker);
  }


  // Delete vote messages
  let c = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.fetch(snowflakes.channels.ask);
  for (let i = 0; i < target.length; i++) {
    fs.unlinkSync(`./data/${target[i].file}`);
    try {
      let m = await c.messages.fetch(target[i].fetch.message);
      if (m) m.delete().catch(() => u.errorHandler(`ERR: Insufficient permissions to delete messages.`));
    } catch (error) {
      if (error.toString().indexOf("Unknown Message") > -1) {
        u.errorHandler("That question has been deleted")
      }
      else throw error;
    }

  }

}

async function checkForDuplicates() {
  let files = fs.readdirSync("./data/").filter(x => x.endsWith(".json"));
  let uniqueQuestions = [];
  let duplicates = [];
  for (let i = 0; i < files.length; i++) {
    let data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
    if (uniqueQuestions.includes(data.details.question)) {
      duplicates.push(files[i] + ":" + data.details.question);
    } else {
      uniqueQuestions.push(data.details.question);
    }

  }
  for (let index = 0; index < duplicates.length; index++) {
    const element = duplicates[index];
    for (let i = 0; i < files.length; i++) {
      let data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
      if (!duplicates.includes(files[index] + ":" + data.details.question) && data.details.question == element) {
        duplicates.push(files[index] + ":" + data.details.question);
      }

    }
  }
  return duplicates;
}

async function editQuestion(interaction, targetId) {
  // Load data
  let files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
  let rawData = [];
  let asker;
  for (let i = 0; i < files.length; i++) {
    let data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
    if (data.fetch.message == targetId) asker = data.details.asker;
    rawData.push({
      file: files[i],
      fetch: data.fetch,
      string: `${data.details.question}`,
      votes: data.system.IDs.length
    });
  }
  let target = rawData.find(msg => msg.fetch.message == targetId);
  if (target == undefined) {
    interaction.reply({ content: `There are no questions with that ID in my memory crystals`, ephemeral: true });
    return
  }
  target = [target];
  //permissions check
  if (!interaction.member.roles.cache.has(snowflakes.roles.Admin) && !interaction.member.roles.cache.has(snowflakes.roles.Moderator) && !interaction.member.roles.cache.has(snowflakes.roles.BotMaster) && !interaction.member.roles.cache.has(snowflakes.roles.LARPer) && interaction.user.id != asker) {
    interaction.reply({ content: "Radiance cannot permit you to do that", ephemeral: true });
    return;
  }
  // Check
  if (rawData.length == 0) {
    interaction.reply({ content: `There are no questions to edit! Check back later.`, ephemeral: true });
    return;
  }


  const modal = new Modal()
    .setCustomId("editQuestionModal")
    .setTitle("Edit Question");

  const newQuestionInput = new TextInputComponent()
    .setCustomId('editQuestionModalInput')
    .setLabel("New Question Text")
    .setMaxLength(1000)
    .setPlaceholder(target[0].string.slice(0, 99))
    // Paragraph means multiple lines of text.
    .setStyle("PARAGRAPH");
  const firstActionRow = new MessageActionRow().addComponents(newQuestionInput);
  modal.addComponents(firstActionRow);
  await interaction.showModal(modal);
}


async function ask(interaction, bypassWait) {
  const hoursBetweenQuestions = 72;

  if (interaction instanceof Message) {
    // correct channel?
    if (interaction.channel.id != snowflakes.channels.ask) {
      await interaction.reply({ content: `You can't do that here. Try in <#${snowflakes.channels.ask}>`, ephemeral: true });
      return;
    }
    //make sure the object has the correct structure
    interaction.user = interaction.author
    //Akn
    await interaction.react("👍");
    u.clean(interaction, 3);
  }
  if (askedRecently.has(interaction.user.id) && !bypassWait) {
    interaction.reply({ content: "Wait a few hours before asking again. - <@" + interaction.user + ">\nYour question was: " + (interaction.options ? interaction.options.get("question").value : interaction.cleanContent), ephemeral: true });
  } else {
    // Akn
    try {
      u.clean(await interaction.reply({ content: 'The Question Has been registered', ephemeral: true }));
    } catch (error) {
      u.noop();
    }


    // Write JSON
    let data = {
      details: {
        asker: interaction.user.id,
        question: interaction.options ? interaction.options.get("question").value : interaction.cleanContent,
        number: ""
      },
      fetch: {
        channel: snowflakes.channels.ask,
        message: ""
      },
      system: {
        IDs: [
          Module.client.user.id
        ],
        entered: Date.now()
      }
    }


    // Reply
    let embed = u.embed()
      .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL())
      .setDescription(interaction.options ? interaction.options.get("question").value : interaction.cleanContent)
      .setFooter(`Question ${(fs.readdirSync(`./data/`).filter(t => t.endsWith(`.json`)).length + 1)}`)
      .setTimestamp()
      .setColor(interaction.guild ? interaction.guild.members.cache.get(interaction.client.user.id).displayHexColor : "000000");
    let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", data)
    let msg = await interaction.guild.channels.cache.get(snowflakes.channels.ask).send({ embeds: [embed], components: row });

    data = {
      details: {
        asker: interaction.user.id,
        question: interaction.options ? interaction.options.get("question").value : interaction.cleanContent,
        number: (msg.id)
      },
      fetch: {
        channel: snowflakes.channels.ask,
        message: msg.id
      },
      system: {
        IDs: [
          Module.client.user.id
        ],
        entered: Date.now()
      }
    }

    console.log(`${interaction.user.tag} asked:\n\t${data.details.question}\n\nID:${data.fetch.message}\n\n\n`)
    fs.writeFileSync(`./data/${msg.id}.json`, JSON.stringify(data, null, 4));

    // Adds the user to the set so that they can't ask for a few hours
    if (!interaction.member.roles.cache.has(snowflakes.roles.Admin) && !interaction.member.roles.cache.has(snowflakes.roles.Moderator) && !interaction.member.roles.cache.has(snowflakes.roles.BotMaster)) {
      askedRecently.add(interaction.user.id);
      setTimeout(() => {
        // Removes the user from the set after 3 hours
        askedRecently.delete(interaction.user.id);
      }, hoursBetweenQuestions * 60 * 60 * 1000);
    }
  }
}

function transferAnswerComponents(identifier) {
  return [new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('qqa' + identifier)//qqa stands for question queue answer
      .setStyle('PRIMARY')
      .setLabel('Click to Answer'),
    new MessageButton()
      .setCustomId('RAFO')//qqa stands for question queue answer
      .setStyle('DANGER')
      .setLabel('Click to RAFO'),
    new MessageButton()
      .setCustomId('qqaRecycle')//qqa stands for question queue answer
      .setStyle('SECONDARY')
      .setLabel('Click to Answer another time'),

  )]
}
async function processRecycleButton(interaction) {
  if (!canAnswerQuestions(interaction) && !interaction.member.roles.cache.has(snowflakes.roles.Admin) && !interaction.member.roles.cache.has(snowflakes.roles.Moderator) && !interaction.member.roles.cache.has(snowflakes.roles.CommunityGuide) && !interaction.member.roles.cache.has(snowflakes.roles.BotMaster) && !interaction.member.roles.cache.has(snowflakes.roles.LARPer))
    return interaction.reply({ content: "I'm sorry, you can't do that", ephemeral: true })
  else {
    interaction.channel = interaction.guild.channels.cache.get(snowflakes.channels.ask);
    interaction.user = interaction.message.mentions.parsedUsers.first();
    interaction.options = null;
    interaction.cleanContent = interaction.message.embeds[0].description;
    await ask(interaction, true);
    try {
      await interaction.message.delete();
    }
    catch (e) {
      try {
        await interaction.message.edit({ components: [] });
      }
      catch (e) {
        u.noop()
      }
    }
  }

}

async function processTransfer(interaction) {

  // correct channel?
  if (interaction.channel.id != snowflakes.channels.transfer) {
    await interaction.reply({ content: `You can't do that here. Try in <#${snowflakes.channels.transfer}>`, ephemeral: true });
    return;
  }
  let numberOfQuestions = interaction?.options?.get("questions")?.value || 5
  // Load data
  let files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
  let rawData = [];

  for (let i = 0; i < files.length; i++) {
    let data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
    //ensure data has minimum required feilds.
    if (data && data.system && data.system.IDs && data.fetch && data.details && data.details.asker && data.details.question) {
      let pushData = {
        file: files[i],
        fetch: data.fetch,
        question: data.details.question,
        votes: data.system.IDs.length
      }
      try {
        pushData.asker = await interaction.guild.members.fetch(data.details.asker);
      } catch (error) {
        pushData.asker = data.details.asker
      }
      rawData.push(pushData);
    }
  }

  // Sort
  let sorted = rawData.sort((a, b) => (a.votes < b.votes) ? 1 : -1);

  // Check
  if (sorted.length == 0) {
    interaction.reply({ content: `There are no questions to answer! Check back later.` });
    return;
  }
  interaction.reply({ ephemeral: true, content: "👌" });
  // Format
  let accepted = [];
  for (let i = 0; i < numberOfQuestions; i++) {
    if (sorted[i]) {
      accepted[i] = sorted[i];
      let url = undefined;
      try {
        url = sorted[i].asker?.avatarURL();
      } catch (error) {
        url = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Question_mark_%28black%29.svg/800px-Question_mark_%28black%29.svg.png";
      }
      interaction.guild.channels.cache.get(snowflakes.channels.transfer).send({
        content: "<@" + (sorted[i].asker?.id || sorted[i].asker) + ">",
        embeds: [
          u.embed()
            .setAuthor(
              {
                name: sorted[i].asker?.displayName || sorted[i].asker,
                iconURL: url,
              }
            )
            .setDescription(sorted[i].question)
            .setFooter({ text: "Votes: " + sorted[i].votes })
            .setColor(sorted[i].asker?.displayHexColor || "#03cafc")
        ],
        components: transferAnswerComponents(i),
        allowedMentions: {
          parse: ['users']
        }
      })
    }
  }



  // Delete vote messages
  let c = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.fetch(snowflakes.channels.ask);
  for (let i = 0; i < accepted.length; i++) {
    fs.unlinkSync(`./data/${accepted[i].file}`);
    let m = false;
    try {
      m = await c.messages.fetch(accepted[i].fetch.message);
    } catch (error) {
      if (error.toString().indexOf("Unknown Message") > -1) {
        u.errorHandler("That question has been deleted")
      }
    }

    if (m) m.delete().catch(() => u.errorHandler(`ERR: Insufficient permissions to delete messages.`));
  }

}

async function processQQAButtonModalMaker(interaction) {
  const modal = new Modal()
    .setCustomId("answerQuestionModal")
    .setTitle("Answer Question");

  const newQuestionInput = new TextInputComponent()
    .setCustomId('answerQuestionModalInput')
    .setLabel("Answer")
    .setMaxLength(4000)
    .setPlaceholder(interaction.message.embeds[0].description.toString().slice(0, 99))
    // Paragraph means multiple lines of text.
    .setStyle("PARAGRAPH");
  const firstActionRow = new MessageActionRow().addComponents(newQuestionInput);
  return modal.addComponents(firstActionRow);

}

function worldmakerReplyEmbed(interaction) {
  return u.embed().setAuthor({
    name: interaction.member.displayName,
    iconURL: interaction.member.avatarURL() || interaction.member.user.avatarURL()
  }).setColor(interaction.member.displayHexColor)
}

async function processqqaButton(interaction) {
  if (canAnswerQuestions(interaction)) {
    await interaction.showModal(await processQQAButtonModalMaker(interaction));
  }
  else interaction.reply({ content: "I'm sorry, but you don't have access to that.", ephemeral: true })
}

async function processRAFOButton(interaction) {
  if (canAnswerQuestions(interaction)) {
    let embeds = interaction.message.embeds;
    embeds[0].setColor("#ED4245");
    embeds.push(worldmakerReplyEmbed(interaction).setDescription("You're going to have to read and find out on that one I'm afraid."))
    interaction.update({ embeds: embeds, components: [] })
  }
  else interaction.reply({ content: "I'm sorry, but you don't have access to that.", ephemeral: true })
}

async function processStats(interaction) {
  {

    let statEmbed = u.embed().setTitle("Question Queue Stats").setColor(interaction.guild ? interaction.guild.members.cache.get(interaction.client.user.id).displayHexColor : "000000")
    let page = interaction?.options?.get("page")?.value || 1

    let numberOfQuestions = 5;

    if (page < 1) page = 1;

    // Load data
    let files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
    let rawData = [];
    for (let i = 0; i < files.length; i++) {
      let data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
      rawData.push({
        file: files[i],
        fetch: data.fetch,
        string: `<@${data.details.asker}>: ${data.details.question}`,
        votes: data.system.IDs.length
      });
    }

    // Sort
    let sorted = rawData.sort((a, b) => (a.votes < b.votes) ? 1 : -1);
    statEmbed.addField("Total questions", "`" + sorted.length + "`");
    // Check
    if (sorted.length == 0) {
      statEmbed.addField("Top Questions:", "`There are no questions in the Queue`")
      interaction.reply({ embeds: [statEmbed] });
      return
    }
    if (page > Math.ceil(sorted.length / numberOfQuestions)) page = Math.ceil(sorted.length / numberOfQuestions);
    for (let i = page * numberOfQuestions - numberOfQuestions; i < page * numberOfQuestions; i++) {
      if (sorted[i]) {
        statEmbed.addField("Top Question " + (i + 1) + ":" + "( " + sorted[i].votes + " votes)", sorted[i].string.substring(0, 1000));
      }
    }
    statEmbed.setFooter({ text: `Page ${page} of ${Math.ceil(sorted.length / numberOfQuestions)}` });
    // Send
    return interaction.reply({ embeds: [statEmbed] });
  }
}

const Module = new Augur.Module()
  .addInteractionCommand({
    name: "question",
    guildId: snowflakes.guilds.PrimaryServer,
    process: async (interaction) => {
      try {
        let duplicates = await checkForDuplicates()
        if (duplicates.length > 0) u.errorLog.send({ content: `<@${config.ownerId}> **Warning: duplicate questions in question queue files.**\n\n\n${duplicates.join("\n")}`.slice(0, 1950) })
        const subcommand = interaction.options.getSubcommand(true);
        if (subcommand === "ask") {
          await ask(interaction);
        } else if (subcommand === "transfer") {
          if (canAnswerQuestions(interaction))
            await processTransfer(interaction);
          else interaction.reply({ content: "Unfortunetly, you don't have permission to do that", ephemeral: true });
        } else if (subcommand === "stats") {
          await processStats(interaction)
        } else {
          interaction.reply({
            content: "Well, this is embarrasing. I don't know what you asked for.",
            ephemeral: true
          });
          u.errorHandler(Error("Unknown Question Interaction Subcommand"), interaction);
        }
      } catch (error) {
        u.errorHandler(error, interaction);
      }
    }
  }).addInteractionHandler({
    customId: "upVoteQuestion",
    process: async (interaction) => {
      // Check & Load data
      if (!fs.existsSync(`./data/${interaction.message.id}.json`)) return;
      let data = JSON.parse(fs.readFileSync(`./data/${interaction.message.id}.json`));

      // Already voted?
      if (data.system.IDs.includes(interaction.user.id)) {
        let msg = await interaction.channel.messages.fetch(interaction.message.id);
        let row = questionRowButtons("DANGER", "SECONDARY", "SECONDARY", "", data);
        msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: row });

      } else {
        data.system.IDs.push(interaction.user.id);
        fs.writeFileSync(`./data/${interaction.message.id}.json`, JSON.stringify(data, null, 4));
      }

      // Update message with new count
      let msg = await interaction.channel.messages.fetch(interaction.message.id);
      let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", data);
      msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: row });

      // Respond
      interaction.deferUpdate();
    }
  }).addInteractionHandler({
    customId: "deleteQuestion",
    process: async (interaction) => {
      let target = [interaction.message.id];
      deleteQuestion(interaction, target);
    }

  }).addInteractionHandler({
    customId: "editQuestion",
    process: async (interaction) => {
      let target = interaction.message.id;
      editQuestion(interaction, target);
    }

  }).addInteractionHandler({
    customId: "moveQuestion",
    process: async (interaction) => {
      let target = [interaction.message.id];
      moveQuestion(interaction, target);
    }

  }).addInteractionHandler({
    customId: "editQuestionModal",
    process: async (interaction) => {
      let targetId = interaction.message.id;
      let newText = interaction.components[0].components[0].value;
      // Load data
      let files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
      let target;
      let data;
      for (let i = 0; i < files.length; i++) {
        data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
        if (data.fetch.message == targetId) {
          target = data;
        }
      }
      if (target == undefined) {
        interaction.reply({ content: `There are no questions with that ID in my memory crystals`, ephemeral: true });
        return
      }

      //-----------------------
      target.details.question = newText;

      fs.writeFileSync(`./data/${interaction.message.id}.json`, JSON.stringify(target, null, 4));
      let msg = await interaction.channel.messages.fetch(interaction.message.id);
      let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", target);

      let author = interaction.guild.members.cache.get(target.details.asker)

      msg.edit({ embeds: [msg.embeds[0].setDescription(target.details.question).setAuthor({ name: author ? author.displayName : "unknown user", iconURL: author ? author.displayAvatarURL() : "https://www.seekpng.com/png/full/9-96714_question-mark-png-question-mark-black-png.png" })], components: row });

      // Respond
      interaction.deferUpdate();

    }

  }).addInteractionHandler({
    customId: "answerQuestionModal",
    process: async (interaction) => {
      if (canAnswerQuestions(interaction)) {
        let answer = interaction.components[0].components[0].value;
        let embeds = interaction.message.embeds;
        embeds[0].setColor("#5865F2#")
        embeds.push(worldmakerReplyEmbed(interaction).setDescription(answer))
        interaction.update({ embeds: embeds, components: [] })
      }
      else interaction.reply({ content: "Unfortunetly, you don't have permission to do that", ephemeral: true });


    }

  }).addInteractionHandler({
    customId: "voteCheck",
    process: async (interaction) => {
      // Check & Load data
      if (!fs.existsSync(`./data/${interaction.message.id}.json`)) return;
      let data = JSON.parse(fs.readFileSync(`./data/${interaction.message.id}.json`));

      // Already voted?
      if (data.system.IDs.includes(interaction.user.id)) {
        interaction.reply({ content: "You have already voted for that question", ephemeral: true })
        //msg = await interaction.channel.messages.fetch(interaction.message.id);
        //row = questionRowButtons("SECONDARY", "SUCCESS", "SECONDARY", "✅", data)
        //msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: row });
      } else {
        interaction.reply({ content: "You have not voted for that question", ephemeral: true })
        //msg = await interaction.channel.messages.fetch(interaction.message.id);
        //row = questionRowButtons("SECONDARY", "DANGER", "SECONDARY", "❌", data);
        //msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: row });
      }

      // Update message with new count
      let msg = await interaction.channel.messages.fetch(interaction.message.id);
      let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", data);

      let author = interaction.guild.members.cache.get(data.details.asker)

      msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question).setAuthor({ name: author ? author.displayName : "unknown user", iconURL: author ? author.displayAvatarURL() : "https://www.seekpng.com/png/full/9-96714_question-mark-png-question-mark-black-png.png" })], components: row });

      // Respond
      //interaction.deferUpdate();
    }
  }).addInteractionHandler({
    customId: "unvoteQuestion",
    process: async (interaction) => {
      // Check & Load data
      if (!fs.existsSync(`./data/${interaction.message.id}.json`)) return;
      let data = JSON.parse(fs.readFileSync(`./data/${interaction.message.id}.json`));

      // Already voted?
      if (data.system.IDs.includes(interaction.user.id)) {
        data.system.IDs = data.system.IDs.filter((id) => (id != interaction.user.id && id != null));
        fs.writeFileSync(`./data/${interaction.message.id}.json`, JSON.stringify(data, null, 4));
      } else {
        let msg = await interaction.channel.messages.fetch(interaction.message.id);
        let row = questionRowButtons("SECONDARY", "SECONDARY", "DANGER", "", data);
        msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: row });
      }

      // Update message with new count
      let msg = await interaction.channel.messages.fetch(interaction.message.id);
      let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", data);
      msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: row });

      // Respond
      interaction.deferUpdate();
    }
  }).addEvent("messageCreate", async (msg) => {
    if (msg.author.bot || msg.channel.id != snowflakes.channels.ask) return;
    ask(msg);
  }).addInteractionHandler({ customId: `qqa0`, process: processqqaButton })
  .addInteractionHandler({ customId: `qqa1`, process: processqqaButton })
  .addInteractionHandler({ customId: `qqa2`, process: processqqaButton })
  .addInteractionHandler({ customId: `qqa3`, process: processqqaButton })
  .addInteractionHandler({ customId: `qqa4`, process: processqqaButton })
  .addInteractionHandler({ customId: `RAFO`, process: processRAFOButton })
  .addInteractionHandler({ customId: `qqaRecycle`, process: processRecycleButton })
  .setInit((data) => { if (data) askedRecently = data })
  .setUnload(() => { return askedRecently });


module.exports = Module;