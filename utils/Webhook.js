const Discord = require("discord.js");
module.exports = {
  /**
   * 
   * @param {Discord.Channel} channel 
   * @param {string} name 
   * @param {string} avatar 
   * @param {Discord.MessageCreateOptions} message 
   * @returns 
   */
  webhook: async (channel, name, avatar, message) => {
    let thread = null;
    if (channel.type == 'GUILD_PUBLIC_THREAD') {
      thread = channel;
      channel = await channel.parent;
      message.threadId = thread.id;
    }

    let webhooks = await channel.fetchWebhooks()

    let webhook = webhooks.find(w => w.name.toLowerCase().indexOf(name.toLowerCase()) > -1);
    if (!webhook) {
      return await channel.createWebhook(name, {
        avatar: avatar,
        reason: 'Bot Feature'
      })
        .then(sel => sel.send(message)).catch(err => { throw err });
    }
    else return (await webhook).send(message);
  }
}