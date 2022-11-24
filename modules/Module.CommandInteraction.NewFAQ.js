const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  snowflakes = require('../config/snowflakes.json');
const { MessageActionRow, MessageButton } = require("discord.js");
const Module = new Augur.Module();
const Guild = await Module.client.guilds.fetch(snowflakes.guilds.PrimaryServer);
const gs = require("../utils/Utils.GetGoogleSheetsAsJson");

class FAQfile {
  constructor(category) {
    if (!fs.existsSync(`./faq/${category}`)) {
      this.messageIDs
      this.write()
    }
    let data = JSON.parse(fs.readFileSync(`./faq/${category}`));
    data.messageIDs = messageIDs;
    data.category = category;
  }
  write() {
    fs.writeFileSync(`./faq/${this.category}.json`, JSON.stringify({ messageIDs: this.messageIDs, category: this.category }, null, 4));
  }
}

function writeFAQfile({ messageIDs, Category }) {

}

function getMessageForCategory(Category) {

}



async function updateFaqMessage(Category) {
  let message = getMessageForCategory(Category);

}





Module.addInteractionHandler({ customId: `faq0`, process: processFaqButton })
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



