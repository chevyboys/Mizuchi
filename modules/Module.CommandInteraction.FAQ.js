const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json');
const { MessageActionRow, MessageButton } = require("discord.js");

let questions = [];

async function dynamicallyCreateButtons(faqsfile) {
  let rows = [];
  let rowi = 0;
  let faqId = 0;
  let row = new MessageActionRow();
  for (const faq of faqsfile.qAndA) {
    if (faq.question.length > 80) {
      u.errorHandler("Question Length " + faq.question.length + " is over the warning threshold of 80 characters.\n" + "```Question error: " + faq.question + "```Length:" + faq.question.length)
    }
    if (faq.answer.length > 2000) {
      u.errorHandler("Answer Length " + faq.answer.length + " is over 2000 characters. I'm going to have to cut off the end!\n" + "```Question error: " + faq.question)
    }
    if (rowi > 4) {
      rowi = 0;
      rows.push(row);
      row = new MessageActionRow();
    }
    row.addComponents(
      new MessageButton()
        .setCustomId(`faq${faqId}`)
        .setLabel(`${faq.question.trim().slice(0, 80)}`)
        .setStyle('SECONDARY')
    )
    questions.push({
      question: faq.question.trim().slice(0, 80),
      answer: faq.answer.trim().slice(0, 2000),
      faqId: `faq${faqId}`,
      faqMsgId: faqsfile.messageId
    })
    rowi++;
    faqId++;
  }
  rows.push(row);
  if (rows.length > 5) {
    rows = rows.slice(0, 4);
  }
  return rows;
}

function processFaqButton(interaction) {
  let qAndA = questions.find(q => (q.faqId == interaction.customId && q.faqMsgId == interaction.message.id))
  let embed = u.embed().setTitle(qAndA.question).setDescription(qAndA.answer).setColor(interaction.member.displayHexColor);

  interaction.reply({ embeds: [embed], ephemeral: true })
}

async function updateFaqMessage(faqFile, faqFileName, Module) {
  faqFileName = faqFileName.replace(".json", "");
  let faqGuild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
  let faqChannel = await faqGuild.channels.fetch(snowflakes.channels.faq);
  let faqMsg = await faqChannel.messages.fetch(faqFile.messageId);
  //  let embed = u.embed({ color: 0xF0004C, author: faqMsg.member })
  //  .setTitle(`FAQ: ${faqFileName}`)
  // .setColor(faqMsg.member.displayHexColor)
  //.setTimestamp()
  //.setAuthor(faqMsg.member.displayName, faqMsg.member.user.displayAvatarURL())
  //.setDescription("Click any of the question buttons below to see the answer to the question.");

  let components = await dynamicallyCreateButtons(faqFile);
  faqMsg.edit({ content: `**__FAQ: ${faqFileName}__**`, embeds: [], components: components });
}

const Module = new Augur.Module()
  .addEvent("ready", async () => {
    const testFolder = './faq/';
    const fs = require('fs');

    fs.readdir(testFolder, async (err, files) => {
      if (typeof files != typeof []) files = [files];
      for (const file of files) {
        let faqFile = require(`../faq/${file}`);
        if (file.toLowerCase().indexOf("-example") > -1) continue
        else {
          if (faqFile.messageId == "") {
            let faqGuild = Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
            let faqChannel = await faqGuild.channels.fetch(snowflakes.channels.faq);
            let newFaqMsg = await faqChannel.send({ embeds: [(u.embed().setDescription("🔃 Generating FAQ. Please wait"))] });
            faqFile.messageId = newFaqMsg.id;
            fs.writeFileSync(`./faq/${file}`, JSON.stringify(faqFile, 1, 4));
          }
          await updateFaqMessage(faqFile, file, Module)
        }
      }
    });

  })
  .setInit((data) => {
    if (data) questions = data;
  }
  ).setUnload(() => { return questions; })
  .addInteractionHandler({ customId: `faq0`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq1`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq2`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq3`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq4`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq5`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq6`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq7`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq8`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq9`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq10`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq11`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq12`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq13`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq14`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq15`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq16`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq17`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq18`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq19`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq20`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq21`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq22`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq23`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq24`, process: processFaqButton })
  .addInteractionHandler({ customId: `faq25`, process: processFaqButton })




module.exports = Module;