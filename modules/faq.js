const Augur = require("augurbot"),
    u = require("../utils/utils"),
    snowflakes = require('../config/snowflakes.json');
const faqs = require("../faq/faq.json");
const { MessageActionRow, MessageButton } = require("discord.js");

let questions = [];

async function dynamicallyCreateButtons(faqsfile){
    let rows = [];
    let rowi = 0;
    let row;
    for (const faq of faqsfile) {
        if(rowi == 5) {
            rowi == 0;
            rows.push(row);
        }
        if(rowi == 0){
            row = new MessageActionRow();
        }
        row.addComponents(
            new MessageButton()
                        .setCustomId('faq')
                        .setLabel(`Q: ${faq.question}`)
                        .setStyle('SECONDARY')
        )
        questions.push({
            question: faq.question,
            answer: faq.answer,
        })
        rowi++;
    }
    rows.push(row);
    if(rows.length > 5){
        rows = rows.slice(0,4);
    }
    console.log(JSON.stringify(rows));
    return rows;
}

function processFaqButton(interaction){
    console.log(JSON.stringify(interaction));
}



const Module = new Augur.Module()
.addEvent("ready", async () => {
    let faqMsg = await (await (await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)).channels.fetch(snowflakes.channels.earthTemple)).messages.fetch(snowflakes.messages.faq);
    let embed = u.embed({ color: 0xF0004C, author: faqMsg.member })
    .setTitle(`FAQ`)
    .setColor(0xF0004C)
    .setTimestamp()
    .setAuthor(faqMsg.member.displayName, faqMsg.member.user.displayAvatarURL())
    .setDescription("click any of the buttons below to see the answer to the question");

    let components = await dynamicallyCreateButtons(faqs);
    faqMsg.edit({embeds: [embed], components: components});
  }).addInteractionHandler({ customId: `faq`, process: processFaqButton})


module.exports = Module;