const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  config = require("../config/config.json"),
  snowflakes = require('../config/snowflakes.json');
const { Message, MessageButton, MessageActionRow, Modal, TextInputComponent, MessageSelectMenu } = require('discord.js');
const { Collection } = require("../utils/Utils.Generic");
const Questions = new (require("./QuestionQueue/Question"))
const gs = require("../utils/Utils.GetGoogleSheetsAsJson");



let authors;
function getAuthors() {
  gs(snowflakes.sheets.authors).then((r) => authors = r);
}


let askedRecently = new Collection();

//configureables
const canAnswerQuestions = (interaction) => interaction.member.roles.cache.hasAny(
  snowflakes.roles.Admin,
  snowflakes.roles.WorldMaker,
  snowflakes.roles.BotMaster
);
const canModerateQuestions = interaction => interaction.member.roles.cache.hasAny(
  snowflakes.roles.LARPer,
  snowflakes.roles.BotMaster,
  snowflakes.roles.Moderator,
  snowflakes.roles.Admin,
  snowflakes.roles.WorldMaker
) || (interaction.guild.channels.cache.get(snowflakes.channels.ask)).permissionsFor(interaction.member).any([
  "ADMINISTRATOR",
  "MANAGE_MESSAGES",
  "MODERATE_MEMBERS"
])
//helper functions

function checkForExistingAnswer(questionText) {
  return Questions.readOnlyCollection().find(q => q.questionText == questionText)
}

currentQueue = (author, includeWaitingToBeAnswered) => Questions.readOnlyCollection().filter((v, k) => v.status == Questions.Status.Queued && (includeWaitingToBeAnswered || !v.flags.includes(Questions.Flags.unansweredButTransfered)) && (author == "any" || !author ? true : (v.requestedAnswerers.includes(author) || v.requestedAnswerers.includes("any"))))
/**
 * 
 * @param {Discord.Interaction} interaction 
 * @param {Question.messageId} targetId 
 * @param {fn} permissionsOverride a function that receives the interaction and target, and overrides the permissions.
 * @returns 
 */
function getTargetQuestionChecks(interaction, targetId, permissionsOverride, checkNonQueued) {
  if (Array.isArray(targetId)) targetId = targetId[0]
  let target = Questions.readOnlyCollection().get(targetId);
  if (!target) {
    //check to make sure we haven't somehow gotten the wrong id
    target = Questions.readOnlyCollection().find(x => interaction.message?.embeds[0].description == x.questionText)
    if (target == undefined) {
      interaction.reply({ content: `There are no questions with that ID in my memory crystals`, ephemeral: true });
      return null
    } else {
      console.log("Mismatched message id auto-resolved. Be careful!")
      target.update({ messageId: interaction.message.id })
    }
  }

  //permissions check
  if (!canModerateQuestions(interaction) && !(permissionsOverride && permissionsOverride(interaction, target))) {
    interaction.reply({ content: "Radiance cannot permit you to do that", ephemeral: true });
    return null;
  }
  // Check
  if (currentQueue("any", checkNonQueued).size == 0) {
    interaction.reply({ content: `There are no valid questions to do that to! Check back later.`, ephemeral: true });
    return null;
  }
  return target;
}

function newAnswererSelectComponent() {
  let SelectMenuOptions = [];
  //buildSelectMenu
  for (const author of authors) {
    SelectMenuOptions.push({
      label: author.Name,
      description: author.Name,
      value: author.Name,
    })
  }
  SelectMenuOptions.push({
    label: "Any",
    description: "any worldmaker",
    value: "any",
  });
  return new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId('newAnswererSelect')
      .setPlaceholder('Nothing    selected')
      .addOptions(SelectMenuOptions),
  )
}
/**
 * 
 * @param {*} buttonOneStyle 
 * @param {*} buttonTwoStyle 
 * @param {*} buttonThreeStyle 
 * @param {string} buttonTwoEmoji 
 * @param {Question} Question recieves a message id for a question, or the question
 * @returns 
 */
function questionRowButtons(buttonOneStyle, buttonTwoStyle, buttonThreeStyle, buttonTwoEmoji, Question) {
  let question = Questions.readOnlyCollection().get(Question.messageId || Question);
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
          .setLabel(`${!question?.voterIds?.length ? 1 : question.voterIds.length} `)
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
      ),
    newAnswererSelectComponent()
  ]
}


async function deleteMessage(messageId, channel) {
  let chan = channel.id ? channel.id : channel;
  let c = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.fetch(chan);
  try {
    let m = await c.messages.fetch(messageId?.messageId || messageId);
    if (m) m.delete().catch(() => u.errorHandler(`ERR: Insufficient permissions to delete messages.`));
  } catch (error) {
    if (error.toString().indexOf("Unknown Message") > -1) {
      u.errorHandler("That question does not exist")
    } else throw error;
  }
  return;
}

//================= question utility functions ===========================

/**
 * Sets a question to "discarded, and deletes the message that it was in"
 * @param {*} interaction the interaction requesting the deletion
 * @param {*} targetId the message id of the question to delete
 * @param {*} dontReply if the reply will be handled by another function, set this to true 
 * @returns null
 */
async function discardQuestion(interaction, targetId, dontReply) {
  let target = getTargetQuestionChecks(interaction, targetId, (interaction, target) => {
    return target.askerId == interaction.member.id;
  })
  if (!target) return;
  else {
    if (!dontReply) interaction.reply({ content: `I have dismissed ${target.questionText ? target.questionText : target} `, ephemeral: true });

    //allow the asker to send again
    if (askedRecently.has(target.askerId)) {
      askedRecently.delete(target.askerId);
    }
  }
  // Delete vote messages
  Questions.readOnlyCollection().get(target.messageId).update({ status: Questions.Status.Discarded });
  await deleteMessage(target, interaction.channel.id);
}

async function moveToQuestionDiscussion(interaction, targetId) {
  let target = getTargetQuestionChecks(interaction, targetId)
  if (!target) return;
  interaction.reply({ content: `I have moved ${target.questionText} to <#${snowflakes.channels.questionDiscussion}>`, ephemeral: true });
  let newResponseChannel = interaction.guild.channels.cache.get(snowflakes.channels.questionDiscussion)
  let newEmbed = interaction.message.embeds[0]
  let components = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId('qqaRecycle')//qqa stands for question queue answer
      .setStyle('SECONDARY')
      .setLabel('Return to Question Queue')
  )
  await discardQuestion(interaction, targetId, dontReply = true);

  if (askedRecently.has(target.askerId)) {
    askedRecently.delete(target.askerId);
  }
  let newMessageID = await newResponseChannel.send({ content: `<@${target.askerId}>, ${interaction.member.displayName} flagged your question as either already answered, or answerable by the community.They should provide you with more information as a response to this message.`, embeds: [newEmbed], allowedMentions: { parse: ["users"] }, components: [components] })
  target.update({ messageId: newMessageID.id || newMessageID });
  return newMessageID;
}

/**
 * 
 * @param {Discord.interaction} interaction 
 * @param {Question.messageId} targetId 
 * @param {boolean} resetVotes weather or not the votes should be reset
 * @returns {Question.messageId} a new question message id
 */
async function restoreToQueue(interaction, targetId, resetVotes) {
  let target = getTargetQuestionChecks(interaction, targetId, null, true)
  if (!target) return;
  interaction.reply({ content: `I have moved ${target.questionText} to <#${snowflakes.channels.ask}>`, ephemeral: true });
  let newResponseChannel = interaction.guild.channels.cache.get(snowflakes.channels.ask);
  let components = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", target);
  //generate a fake interaction that has the proper pfp and name for the question queue embed to process
  let fakeInteraction = interaction;
  let bot = (await interaction.guild.members.fetch(Module.client.user.id))
  fakeInteraction.member = await interaction.guild.members.fetch(target.askerId) || {
    displayName: "Tavare, on behalf of unknown",
    displayAvatarURL: bot.displayAvatarURL
  }
  let newMessageID = await newResponseChannel.send({ embeds: [questionQueueEmbed(fakeInteraction, interaction.message.embeds[0].description)], allowedMentions: { parse: ["users"] }, components: components })
  await deleteMessage(targetId, interaction.channel.id);
  let messageIdOption = newMessageID.id || newMessageID;
  let voterIdsOption = resetVotes ? [interaction.client.user.id] : target.voterIds
  let flagsOption = target.flags.includes(Questions.Flags.unansweredButTransfered) ?
    target.flags.filter(flag => flag != Questions.Flags.unansweredButTransfered) :
    target.flags
  target.update({
    messageId: messageIdOption,
    voterIds: voterIdsOption,
    flags: flagsOption,
    status: Questions.Status.Queued
  });
  return newMessageID;
}


async function editQuestion(interaction, targetId) {
  let target = getTargetQuestionChecks(interaction, targetId)
  if (!target) return;

  const modal = new Modal()
    .setCustomId("editQuestionModal")
    .setTitle("Edit Question");

  const newQuestionInput = new TextInputComponent()
    .setCustomId('editQuestionModalInput')
    .setLabel("New Question Text")
    .setMaxLength(1000)
    .setPlaceholder(interaction.message.embeds[0].description.slice(0, 99))
    // Paragraph means multiple lines of text.
    .setStyle("PARAGRAPH");

  const firstActionRow = new MessageActionRow().addComponents(newQuestionInput);
  modal.addComponents(firstActionRow);
  return await interaction.showModal(modal);
}

function questionQueueEmbed(interaction, questionTextOverride) {
  let authorName = interaction.options?.get("answerer")?.value ? interaction.options?.get("answerer")?.value : interaction.values ? interaction.values[0] : Questions.readOnlyCollection().get(interaction.message?.id)?.requestedAnswerers[0];
  let authorData = authors.find(a => a.Name.trim() == authorName);
  let embed = u.embed()
    .setAuthor({ name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL() })
    .setDescription(interaction.options ? interaction.options.get("question").value : questionTextOverride)
    .setFooter({
      text: `Asked to: ${authorName} | ${currentQueue(authorName).size} questions remaining in Queue`,
      iconURL: authorData ? authorData.imageUrl : null
    })
    .setColor(authorData?.hexColor || interaction.guild ? interaction.guild.members.cache.get(interaction.client.user.id).displayHexColor : "000000");
  return embed;
}

async function ask(interaction, bypassWait) {
  let numberOfQuestions = currentQueue(interaction.options.get("answerer").value).size + 1;
  let hoursBetweenQuestions = numberOfQuestions < 30 ? 0 : (numberOfQuestions < 60 ? numberOfQuestions / 5 : (numberOfQuestions < 72 ? numberOfQuestions : 72));

  if (askedRecently.has(interaction.user.id) && !bypassWait) {
    interaction.reply({ content: "You can ask again <t:" + Math.floor(askedRecently.get(interaction.user.id) / 1000) + ":R> . - <@" + interaction.user + ">\nYour question was: " + (interaction.options ? interaction.options.get("question").value : interaction.cleanContent), ephemeral: true });
  } else {
    // Akn


    let questionData = {
      messageId: "",
      status: Questions.Status.Queued,
      askerId: interaction.user.id,
      questionText: interaction.options.get("question").value,
      voterIds: [Module.client.user.id],
      requestedAnswerers: [interaction.options.get("answerer").value],
      flags: [],
      timestamp: Date.now(),
      answerText: ""
    }
    let askedBefore = checkForExistingAnswer(questionData.questionText);
    if (askedBefore) {
      let askerName = (await interaction.guild.members.fetch(askedBefore.askerId))?.displayName
      if (askedBefore.status == Questions.Status.Answered) {
        let author = authors.find((a) => a.discordId == askedBefore.requestedAnswerers[0])

        return interaction.reply({
          content: "It seems that question has already been asked before by " + (askerName ? askerName : "an unknown user") + ", here is the answer:",
          embeds: [(await (await interaction.guild.channels.fetch(author.answerChannelId)).messages.fetch(askedBefore.messageId)).embeds[1]],
          ephemeral: true
        })
      } else {
        return interaction.reply({
          content: "It seems that question has already been asked before by " + (askerName ? askerName : "an unknown user") + ", it is currently " + askedBefore.status,
          ephemeral: true
        })
      }
    }
    try {
      u.clean(await interaction.reply({ content: 'The Question Has been registered', ephemeral: true }));
    } catch (error) {
      u.noop();
    }

    // Reply

    let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", questionData)
    let msg = await interaction.guild.channels.cache.get(snowflakes.channels.ask).send({ embeds: [questionQueueEmbed(interaction)], components: row });

    questionData.messageId = msg.id;

    console.log(`${interaction.user.tag} asked:\n\t${questionData.questionText}\n\nID:${questionData.messageId}\n\n\n`)
    new Questions.Question(questionData, true);

    // Adds the user to the set so that they can't ask for a few hours
    if (!bypassWait && !canModerateQuestions(interaction)) {
      let date = new Date();
      date.setHours(date.getHours() + hoursBetweenQuestions)
      askedRecently.set(interaction.user.id, date);
      setTimeout(() => {
        // Removes the user from the set after the set number of hours
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
      .setLabel('Answer'),
    new MessageButton()
      .setCustomId('RAFO')//qqa stands for question queue answer
      .setStyle('DANGER')
      .setLabel('RAFO'),
    new MessageButton()
      .setCustomId('qqaRecycle')//qqa stands for question queue answer
      .setStyle('SECONDARY')
      .setLabel('Answer Later'),
  ),
  newAnswererSelectComponent()
  ]
}


async function processRecycleButton(interaction) {
  if (!canAnswerQuestions(interaction) && !canModerateQuestions(interaction))
    return interaction.reply({ content: "I'm sorry, you can't do that", ephemeral: true })
  else {
    return await restoreToQueue(interaction, interaction.message.id, false)
  }

}

async function processTransfer(interaction, forceRequestedAnswerer) {

  let numberOfQuestions = 5
  let author = authors.find((a) => a.discordId == interaction.member.id || a.Name == forceRequestedAnswerer)
  if (!author) interaction.reply({ content: "I'm sorry, but only Authors can do that", ephemeral: true })
  // Sort
  let sorted = currentQueue(author?.Name).sort((a, b) => (a.voterIds.length < b.voterIds.length) ? 1 : -1);

  // Check
  if (sorted.length == 0) {
    interaction.reply({ content: `There are no questions to answer! Check back later.` });
    return;
  }
  interaction.reply({ content: `Transfering questions.`, ephemeral: true });
  // Format
  for (let i = 0; i < numberOfQuestions && i < sorted.size; i++) {
    if (sorted.at(i)) {
      let url = undefined;
      let asker;
      try {
        asker = await interaction.guild.members.fetch(sorted.at(i).askerId) || sorted.at(i).askerId;
      } catch (error) {
        asker = sorted.at(i).askerId;
      }
      try {
        url = asker?.displayAvatarURL();
      } catch (error) {
        url = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Question_mark_%28black%29.svg/800px-Question_mark_%28black%29.svg.png";
      }
      let message = await (interaction.guild.channels.cache.get(author?.answerChannelId)).send({
        content: "<@" + (asker.id || asker) + ">",
        embeds: [
          u.embed()
            .setAuthor(
              {
                name: asker?.displayName || asker,
                iconURL: url,
              }
            )
            .setDescription(sorted.at(i).questionText)
            .setFooter({ text: "Votes: " + sorted.at(i).voterIds.length + " | " + `${currentQueue(forceRequestedAnswerer || authors.find((a) => a.discordId == interaction.member.id)?.Name || "any").size - 1} questions remaining in queue.` })
            .setColor(sorted.at(i).asker?.displayHexColor || "#03cafc")
        ],
        components: transferAnswerComponents(i),
        allowedMentions: {
          parse: ['users']
        }
      })
      let flags = sorted.at(i).flags.concat([Questions.Flags.unansweredButTransfered]);
      if (sorted.at(i).messageId == message.id) {
        throw new Error("Improper message id");
      }
      await deleteMessage(sorted.at(i), snowflakes.channels.ask);
      sorted.at(i).update({ messageId: message.id, flags: flags })
    }
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
    const answer = "You're going to have to read and find out on that one I'm afraid."
    let embeds = interaction.message.embeds;
    embeds[0].setColor("#ED4245");
    embeds.push(worldmakerReplyEmbed(interaction).setDescription(answer))
    interaction.update({ embeds: embeds, components: [] });
    let question = Questions.readOnlyCollection().get(interaction.message.id);
    let flags = question.flags.filter(f => f != Questions.Flags.unansweredButTransfered).concat(Questions.Flags.RAFOed)
    question.update({
      answerText: answer,
      flags: flags,
      status: Questions.Status.Answered,
      requestedAnswerers: [authors.find((a) => a.discordId == interaction.member.id)].Name
    })

  }
  else interaction.reply({ content: "I'm sorry, but you don't have access to that.", ephemeral: true })
}

async function processStats(interaction) {
  {

    let statEmbed = u.embed().setTitle("Question Queue Stats").setColor(interaction.guild ? interaction.guild.members.cache.get(interaction.client.user.id).displayHexColor : "000000")
    let page = interaction?.options?.get("page")?.value || 1

    let numberOfQuestions = 5;

    if (page < 1) page = 1;

    // Sort
    let sorted = currentQueue(interaction.options.get("answerer").value || "any").sort((a, b) => (a.voterIds.length < b.voterIds.length) ? 1 : -1);
    let authorName = (interaction.options.get("answerer").value || "any");
    statEmbed.addFields([{ name: "Total questions for " + (authorName == "any" ? "any author" : authorName), value: "`" + sorted.size + "`" }]);
    // Check
    if (sorted.length == 0) {
      statEmbed.addFields([{ name: "Top Questions:", value: "`There are no questions in the Queue`" }])
      interaction.reply({ embeds: [statEmbed] });
      return
    }
    if (page > Math.ceil(sorted.length / numberOfQuestions)) page = Math.ceil(sorted.length / numberOfQuestions);
    for (let i = page * numberOfQuestions - numberOfQuestions; i < page * numberOfQuestions; i++) {
      if (sorted.at(i)) {
        statEmbed.addFields([{ name: "Top Question " + (i + 1) + ":" + "( " + sorted.at(i).voterIds.length + " votes)", value: sorted.at(i).questionText.substring(0, 1000) }]);
      }
    }
    statEmbed.setFooter({ text: `Page ${page} of ${Math.ceil(sorted.size / numberOfQuestions)}` });
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
      let question = getTargetQuestionChecks(interaction, interaction.message.id, () => true);

      // Already voted?
      if (question.voterIds.includes(interaction.user.id)) {
        let msg = await interaction.channel.messages.fetch(interaction.message.id);
        let row = questionRowButtons("DANGER", "SECONDARY", "SECONDARY", "", question);
        msg.edit({ embeds: [msg.embeds[0].setDescription(question.questionText)], components: row });

      } else {
        //if not voted, update the question
        question.update({ voterIds: question.voterIds.concat([interaction.user.id]) });
        question = getTargetQuestionChecks(interaction, interaction.message.id, () => true);
      }

      // Update message with new count
      let msg = await interaction.channel.messages.fetch(interaction.message.id);
      let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", question);
      msg.edit({ embeds: [msg.embeds[0].setDescription(question.questionText)], components: row });

      // Respond
      interaction.deferUpdate();
    }
  }).addInteractionHandler({
    customId: "deleteQuestion",
    process: async (interaction) => {
      let target = [interaction.message.id];
      discardQuestion(interaction, target);
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
      moveToQuestionDiscussion(interaction, target);
    }

  }).addInteractionHandler({
    customId: "editQuestionModal",
    process: async (interaction) => {
      let targetId = interaction.message.id;
      let newText = interaction.components[0].components[0].value;
      // Load data
      let question = currentQueue("any").get(targetId);
      if (question == undefined) {
        interaction.reply({ content: `There are no questions with that ID in my memory crystals`, ephemeral: true });
        return;
      }

      //-----------------------
      question.update({ questionText: newText });
      let msg = await interaction.channel.messages.fetch(interaction.message.id);
      let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", question);
      let author = await interaction.guild.members.fetch(question.askerId);

      msg.edit({ embeds: [msg.embeds[0].setDescription(question.questionText).setAuthor({ name: author ? author.displayName : "unknown user", iconURL: author ? author.displayAvatarURL() : "https://www.seekpng.com/png/full/9-96714_question-mark-png-question-mark-black-png.png" })], components: row });

      // Respond
      interaction.deferUpdate();

    }

  }).addInteractionHandler({
    customId: "answerQuestionModal",
    process: async (interaction) => {
      if (canAnswerQuestions(interaction)) {
        let answer = interaction.components[0].components[0].value;
        let embeds = interaction.message.embeds;
        embeds[0].setColor(authors.find(a => a.discordId == interaction.member.id)?.hexColor || interaction.member.displayHexColor)
        embeds.push(worldmakerReplyEmbed(interaction).setDescription(answer))
        interaction.update({ embeds: embeds, components: [] })
        let question = Questions.readOnlyCollection().get(interaction.message.id);
        let flags = question.flags.filter(f => f != Questions.Flags.unansweredButTransfered)
        question.update({
          answerText: answer,
          flags: flags,
          status: Questions.Status.Answered,
          requestedAnswerers: [authors.find((a) => a.discordId == interaction.member.id)].Name
        })

      }
      else interaction.reply({ content: "Unfortunetly, you don't have permission to do that", ephemeral: true });
    }

  }).addInteractionHandler({
    customId: "voteCheck",
    process: async (interaction) => {
      // Already voted?
      let question = currentQueue().get(interaction.message.id);
      if (question.voterIds.includes(interaction.user.id)) {
        interaction.reply({ content: "You have already voted for that question", ephemeral: true })
      } else {
        interaction.reply({ content: "You have not voted for that question", ephemeral: true })
      }

      // Update message with new count
      let msg = await interaction.channel.messages.fetch(interaction.message.id);
      let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", question);

      let author = await interaction.guild.members.fetch(question.askerId)

      msg.edit({ embeds: [msg.embeds[0].setDescription(question.questionText).setAuthor({ name: author ? author.displayName : "unknown user", iconURL: author ? author.displayAvatarURL() : "https://www.seekpng.com/png/full/9-96714_question-mark-png-question-mark-black-png.png" })], components: row });

      // Respond
      //interaction.deferUpdate();
    }
  }).addInteractionHandler({
    customId: "unvoteQuestion",
    process: async (interaction) => {

      let question = currentQueue().get(interaction.message.id);

      if (question.voterIds.includes(interaction.user.id)) {
        question.update({ voterIds: question.voterIds.filter((id) => (id != interaction.user.id && id)) });
      } else {
        let msg = await interaction.channel.messages.fetch(interaction.message.id);
        let row = questionRowButtons("SECONDARY", "SECONDARY", "DANGER", "", question);
        msg.edit({ embeds: [msg.embeds[0].setDescription(question.questionText)], components: row });
      }

      // Update message with new count
      let msg = await interaction.channel.messages.fetch(interaction.message.id);
      let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", question);
      msg.edit({ embeds: [msg.embeds[0].setDescription(question.questionText)], components: row });

      // Respond
      interaction.deferUpdate();
    }
  }).addInteractionHandler({ customId: `qqa0`, process: processqqaButton })
  .addInteractionHandler({ customId: `qqa1`, process: processqqaButton })
  .addInteractionHandler({ customId: `qqa2`, process: processqqaButton })
  .addInteractionHandler({ customId: `qqa3`, process: processqqaButton })
  .addInteractionHandler({ customId: `qqa4`, process: processqqaButton })
  .addInteractionHandler({ customId: `RAFO`, process: processRAFOButton })
  .addInteractionHandler({ customId: `qqaRecycle`, process: processRecycleButton })
  .addInteractionHandler({
    customId: `newAnswererSelect`,
    process: async (interaction) => {
      let question = getTargetQuestionChecks(interaction, interaction.message.id, null, true)
      let newRequestedAnswerers = interaction.values;
      //generate a fake interaction that has the proper pfp and name for the question queue embed to process
      let fakeInteraction = interaction;
      fakeInteraction.member = await interaction.guild.members.fetch(question.askerId) || {
        displayName: "Unknown User",
        displayAvatarURL: () => "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Question_mark_%28black%29.svg/800px-Question_mark_%28black%29.svg.png"
      }
      interaction.message.edit({ embeds: [questionQueueEmbed(fakeInteraction, question.questionText)] });
      question.update({
        requestedAnswerers: newRequestedAnswerers,
      });
      if (interaction.channel != snowflakes.channels.ask) restoreToQueue(interaction, interaction.message.id, true);
      else interaction.deferUpdate();
    }
  })
  .setInit((data) => { if (data) askedRecently = data; getAuthors() })
  .setUnload(() => { return askedRecently });


module.exports = Module;