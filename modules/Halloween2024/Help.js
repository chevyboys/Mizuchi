const u = require("../../utils/Utils.Generic");
const instructionsHelp = {
  title: "Ebbing of the Tides 2024 Help",
  fields: [
    {
      name: "Event Traits",
      value: "**Spam Filter: ✅** means that we have a spam filter developed an enabled for this event, and spam messages will not help you obtain emojis.\n**Reaction Based: ✅** means that this event is driven by Emoji Reactions, see explanation below.\n**Secret Code: ❔** means that this event may or may not contain a code for participants to decipher to unlock a secret.\n**Canon Lore Drop: ❌** means that there will be no canonical lore drops in this event.\n**Woldmaker Involvement: ❌** means that no Worldmakers (aka Book Authors- Andrew Rowe and Kayleigh Nicol) were involved with the development of this event."
    },
    {
      name: "Emoji Events",
      value: "This event is driven by Emoji Reactions. When you see emojis left on messages (👻 or 🧚‍♂️), click on them to \"collect\" them and increase your totals for the event. Collect enough emojis, and something special will happen!"
    },
    {
      name: "Available Commands",
      value: "These commands are available:\n\`/holiday inventory\`: Manage your event rewards. (Not yet implemented)\n\`holiday leaderboard\`: See how you and others are doing in the event. (Not yet implemented)\n\`/holiday gift\`: Send someone an Ebbing-tide card. (Not yet implemented)"
    },
    {
      name: "Event Credits",
      value: "__Design__:\nGhost, Dia, SapphireSapphic, Jordan (j0353), Duke, Al, Kester, Elsecaller\n__Code:__\nGhost, Dia, SapphireSapphic, Jordan (j0353)\n__Art Team:__\nJordan, Jonah, Kritta\n__Infrastructure Management:__\nJolteon\n__Special Thanks:__\nAndrew Rowe, Kayleigh Nicol, Pandora, Kritta, Duke, Al, SapphireSapphic, Jordan (j0353), Dia, and all of our wonderful Patreon Patrons that help make events like this possible!"
    }
  ]
}

const help = {
  /**
   * 
   * @param {Interaction} interaction 
   */
  async command(interaction) {
    interaction.reply({ ephemeral: true, embeds: [instructionsHelp] })
    return;
  }
}

module.exports = help;