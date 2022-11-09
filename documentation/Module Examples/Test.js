const Module = new (require("augurbot")).Module;

function isValidChoice(choice, searchString) {
  //put your autocomplete filter to find choices here
  return (choice.toLowerCase().indexOf(searchString.toLowerCase()) > -1);
}

Module.addEvent("interactionCreate", async (interaction) => {
  if (!interaction.isAutocomplete()) return;
  const focusedValue = interaction.options.getFocused();
  const choices = ['Popular Topics: Threads', 'Sharding: Getting started', 'Library: Voice Connections', 'Interactions: Replying to slash commands', 'Popular Topics: Embed preview'];
  const filtered = choices.filter(choice => isValidChoice(choice, focusedValue));
  await interaction.respond(
    filtered.map(choice => ({ name: choice, value: choice })),
  );

}).addInteractionCommand({
  name: "autocomplete",
  guildId: snowflakes.guilds.PrimaryServer,
  process: async (interaction) => {
    interaction.reply({ content: "test complete" });
  }
})
module.exports = Module;

/*
 * to register this command, add this to the register.js file
 new SlashCommandBuilder()
        .setName('autocomplete')
        .setDescription('Testing Autocomplete')
        .addStringOption(option =>
          option.setName('query')
            .setDescription('Phrase to search for')
            .setAutocomplete(true)),
 */