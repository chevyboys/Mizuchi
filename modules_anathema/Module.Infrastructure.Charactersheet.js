const Augur = require("augurbot");
const Module = new Augur.Module();
const u = require('../utils/Utils.Generic.js');
const db = require("../utils/Utils.Database.js");
const { DBCharacter } = db;

// Helper function to check if the user is allowed to bypass ownership restrictions
function canManageAnyCharacter(member) {
  if (!member || !member.roles) return false;
  return member.permissions.has("ADMINISTRATOR")
    || member.roles.cache.has(Module.config.snowflakes.roles.Moderator)
    || member.roles.cache.has(Module.config.snowflakes.roles.Admin)
    || member.roles.cache.has(Module.config.snowflakes.roles.BotMaster);
}

const Command = {
  name: "character",
  process: async (interaction) => {
    try {
      let subcommand = interaction.options.getSubcommand();

      if (subcommand === "create") {
        let name = interaction.options.getString("name");
        let url = interaction.options.getString("url");
        // ensure this is a Google Docs or Google Sheets url
        if (!url.match(/https:\/\/docs\.google\.com\/(document|spreadsheets)\/d\/[a-zA-Z0-9_-]+/)) {
          return interaction.reply({ content: "Please provide a valid Google Docs or Google Sheets URL.", ephemeral: true });
        }
        //make sure that docs and google are within the first 20 characters to prevent people from putting the url in the name and bypassing the regex
        let urlIndex = url.indexOf("docs.google.com");
        if (urlIndex === -1 || urlIndex > 25) {
          return interaction.reply({ content: "Please provide a valid Google Docs or Google Sheets URL.", ephemeral: true });
        }

        await DBCharacter.create(interaction.user.id, name, url);
        await interaction.reply({ content: `Character **${name}** has been successfully registered!`, ephemeral: true });

      } else if (subcommand === "delete") {
        let id = interaction.options.getString("character");
        let char = await DBCharacter.getById(id);

        if (!char) {
          return interaction.reply({ content: "Character not found. It may have already been deleted.", ephemeral: true });
        }

        // Verify Ownership / Permissions
        let isOwner = (char.user_snowflake === interaction.user.id);
        let hasAdminBypass = canManageAnyCharacter(interaction.member);

        if (!isOwner && !hasAdminBypass) {
          return interaction.reply({ content: "You do not have permission to delete a character that doesn't belong to you.", ephemeral: true });
        }

        await DBCharacter.delete(char.id);
        await interaction.reply({ content: `Character **${char.name}** has been deleted.`, ephemeral: true });

      } else if (subcommand === "find") {
        let id = interaction.options.getString("character");
        let char = await DBCharacter.getById(id);

        if (!char) {
          return interaction.reply({ content: "Character not found.", ephemeral: true });
        }

        let embed = u.embed()
          .setTitle(char.name)
          .setURL(char.url)
          .setDescription(`**Owner:** <@${char.user_snowflake}>\n**Link:** ${char.url}`)
          .setFooter({ text: `Created` })
          .setTimestamp(char.date_created);

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.log(error);
      u.errorHandler(error, interaction);
      if (!interaction.replied && !interaction.deferred) {
        interaction.reply({ content: "An error occurred while processing your request.", ephemeral: true }).catch(() => { });
      }
    }
  }
};

Module.addEvent("interactionCreate", async (interaction) => {
  if (!interaction.isAutocomplete() || interaction.commandName != Command.name) return;

  const focusedValue = interaction.options.getFocused(true);

  if (focusedValue.name === "character") {
    let query = focusedValue.value;
    let limitToUser = null;

    // If they are trying to delete and lack moderation perms, restrict search to only their own characters
    if (interaction.options.getSubcommand() === "delete") {
      if (!canManageAnyCharacter(interaction.member)) {
        limitToUser = interaction.user.id;
      }
    }

    try {
      const results = await DBCharacter.search(query, limitToUser);

      if (results.length == 0) {
        return interaction.respond([{ name: "No characters found", value: "0" }]);
      }

      // Map to Discord's required format (name displayed to user, internal DB ID passed to the command)
      await interaction.respond(
        results.map(char => ({ name: char.name, value: String(char.id) }))
      );
    } catch (error) {
      console.log(error);
      await interaction.respond([{ name: "Error searching characters", value: "0" }]);
    }
  }

}).addInteractionCommand(Command);

module.exports = Module;