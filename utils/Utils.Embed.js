const Discord = require("discord.js");

module.exports = {
  /**
  * Returns a MessageEmbed with basic values preset, such as color and timestamp.
  * @param {any} data The data object to pass to the MessageEmbed constructor.
  * @param {boolean} [suppressTimeStamp = false] 
  *   You can override the color and timestamp here as well.
  */
  embed: function (data = {}, suppressTimeStamp = false) {
    if (data?.author instanceof Discord.GuildMember) {
      data.author = {
        name: data.author.displayName,
        iconURL: data.author.user.displayAvatarURL()
      };
    } else if (data?.author instanceof Discord.User) {
      data.author = {
        name: data.author.username,
        iconURL: data.author.displayAvatarURL()
      };
    }
    const embed = new Discord.MessageEmbed(data);
    if (!data?.color) embed.setColor("#e29c04");
    if (!data?.timestamp && !suppressTimeStamp) embed.setTimestamp();
    return embed;
  }
}