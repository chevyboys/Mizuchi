const Augur = require("augurbot"),
    u = require("../utils/utils");
const snowflakes = require('../config/snowflakes.json');
const Parser = require('rss-parser');
const TurndownService = require('turndown')

const parser = new Parser();
const turndownService = new TurndownService();
const blogLink = "https://andrewkrowe.wordpress.com/feed/";
let feed = null;

// Message context menu for bookmarking a message.
async function blogHandler(Module) {
    if (!feed) feed = await parser.parseURL(blogLink);
		const last = feed.items[0].link;
		feed = await parser.parseURL(blogLink);
		const entry = feed.items[0];
		if (last === entry.link) return;
		const thumbnailUrl = feed.image.url
		const embed = new MessageEmbed()
			.setTitle(entry.title)
			.setURL(entry.link)
			.setDescription(turndownService.turndown(entry.content))
			.setColor('#c8dee5')
			.setThumbnail(thumbnailUrl.split('?', 1)[0]);
		return await (await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer)).channels.cache.get(snowflakes.channels.blogAnnouncements).send({
			content: `${snowflakes.roles.Updates.AllUpdates, snowflakes.roles.Updates.BlogUpdates}`,
			embeds: [embed]
		});
}


const Module = new Augur.Module()
.setClockwork(() => {
    let seconds = 10*60;
    try {
      return setInterval((await blogHandler(Module)), seconds * 1000);
    } catch(error) { u.errorHandler(error, "Blog Clockwork"); }
  })

module.exports = Module;