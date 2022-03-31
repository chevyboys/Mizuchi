const Augur = require("augurbot"),
	u = require("../utils/Utils.Generic");
const config = require("../config/config.json");
const snowflakes = require('../config/snowflakes.json');
const Parser = require('rss-parser');
const TurndownService = require('turndown')
const Discord = require("discord.js");


const blogWebHook = new Discord.WebhookClient(config.blogPosts);
const parser = new Parser();
const turndownService = new TurndownService();
const blogLink = "https://andrewkrowe.wordpress.com/feed/";
let feed = null;
const Module = new Augur.Module()

/**
 * Detects new blog posts, and the posts them to the blog webhook.
 * @param {boolean} force Set to true to ignore the check, and post the most recent blog post anyways.
 * @returns {Discord.Message} the message the bot sent via webhook
 */
async function blogHandler(force) {
	if (!feed) feed = await parser.parseURL(blogLink);
	const last = feed.items[0].link;
	feed = await parser.parseURL(blogLink);
	const entry = feed.items[0];
	if (last === entry.link && !force) return;
	const thumbnailUrl = feed.image.url
	const embed = u.embed()
		.setTitle(entry.title)
		.setURL(entry.link)
		.setDescription(turndownService.turndown(entry.content))
		.setColor('#c8dee5')
		.setThumbnail(thumbnailUrl.split('?', 1)[0]);
	return blogWebHook.send({
		content: `<@&${snowflakes.roles.Updates.AllUpdates}>, <@&${snowflakes.roles.Updates.BlogUpdates}>`,
		embeds: [embed]
	});
}



Module.setClockwork(() => {
	let seconds = 10 * 60;
	try {
		return setInterval(blogHandler, seconds * 1000);
	} catch (error) { u.errorHandler(error, "Blog Clockwork"); }
}).addCommand({
	name: "forceblog",
	description: "Forces the blog post in case of an error",
	hidden: true,
	process: async function (msg) {
		try {
			await msg.react("📃");
			blogHandler(true);
		} catch (e) { u.errorHandler(e, msg); }
	},
	permissions: (msg) => Module.config.adminId.includes(msg.author.id)
})

module.exports = Module;