const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic");
const Module = new Augur.Module();
snowflakes = Module.config.snowflakes;
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

async function loadFaqs(client) {
  if (!client) {
    return console.error("Failed to load FAQs: client is missing!");
  }

  const testFolder = './faq/';
  const fs = require('fs');

  // Read the directory synchronously to avoid async context loss
  const files = fs.readdirSync(testFolder);

  for (const file of files) {
    if (file.toLowerCase().indexOf("-example") > -1) continue;

    let faqFile = JSON.parse(fs.readFileSync(`./faq/${file}`, 'utf8'));

    if (faqFile.messageId == "") {
      let faqGuild = client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
      let faqChannel = await faqGuild.channels.fetch(snowflakes.channels.faq);
      let newFaqMsg = await faqChannel.send({ embeds: [u.embed().setDescription("🔃 Generating FAQ. Please wait")] });
      faqFile.messageId = newFaqMsg.id;
      fs.writeFileSync(`./faq/${file}`, JSON.stringify(faqFile, null, 4));
    }
    // Pass the client variable down to the next function
    await updateFaqMessage(faqFile, file, client);
  }
}

// 2. Accept 'client' explicitly here too
async function updateFaqMessage(faqFile, faqFileName, client) {
  faqFileName = faqFileName.replace(".json", "");

  // Use the explicit client parameter instead of Module.client
  let faqGuild = client.guilds.cache.get(snowflakes.guilds.PrimaryServer);
  let faqChannel = await faqGuild.channels.fetch(snowflakes.channels.faq);
  let faqMsg = await faqChannel.messages.fetch(faqFile.messageId);

  let components = await dynamicallyCreateButtons(faqFile);
  await faqMsg.edit({ content: `**__FAQ: ${faqFileName}__**`, embeds: [], components: components });
}

Module
  .setInit(async (data) => {
    if (data) questions = data;

    // For hot-reloads: wait exactly 1 second to guarantee Augurbot 
    // has finished attaching the client to the Module instance.
    setTimeout(() => {
      if (Module.client && Module.client.readyAt) {
        loadFaqs(Module.client);
      }
    }, 1000);
  })
  .setUnload(() => { return questions; })

  // In discord.js v13, the 'ready' event passes the raw client instance 
  // straight into the function parameters. We use it directly!
  .addEvent("ready", (client) => {
    loadFaqs(client || Module.client);
  })
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