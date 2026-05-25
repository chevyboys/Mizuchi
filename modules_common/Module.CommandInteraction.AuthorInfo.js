const Augur = require("augurbot");
const u = require("../utils/Utils.Generic");
const db = require("../utils/Utils.Database");
const { MessageActionRow, MessageButton } = require("discord.js");

const Module = new Augur.Module()
  .addInteractionCommand({
    name: "author-info",
    process: async (interaction) => {
      try {
        const authorName = interaction.options.get("author")?.value;
        if (!authorName) {
          return interaction.reply({
            content: "Please provide an author name.",
            ephemeral: true
          });
        }

        const authors = await db.Author.getAll();
        const author = authors.find(a => a.name === authorName);

        if (!author) {
          return interaction.reply({
            content: `I could not find an author named \"${authorName}\".`,
            ephemeral: true
          });
        }

        if (!author.active) {
          return interaction.reply({
            content: `The author profile for \"${authorName}\" is currently inactive.`,
            ephemeral: true
          });
        }

        if (author.answer_channel_snowflake) {
          //create the link from our database's guild and channel IDs
          let link = `https://discord.com/channels/${author.answer_channel_guild.snowflake}/${author.answer_channel_snowflake}`;
        }

        const embed = u.embed()
          .setTitle(`${author.name}`)
          .setColor(author.hex_color || "#1ed4c1")
          .setDescription(author.active ? "Active author profile" : "Inactive author profile")
          .setThumbnail(author.image_url || null)
          .addFields([
            {
              name: "Answer Channel",
              //the link to the channel so this works across servers, and also shows the channel name instead of just the ID
              value: author.answer_channel_snowflake ? `<#${author.answer_channel_snowflake}>` : "Not set",
              inline: true
            }
          ]);

        if (author.rss_url) {
          embed.addFields([
            {
              name: "RSS",
              value: author.rss_url,
              inline: false
            }
          ]);
        }

        let components = [];

        if (author.links && author.links.length > 0) {
          let row = new MessageActionRow();
          let numberOfButtonsInThisRow = 0;
          author.links.forEach(link => {
            // Add buttons for each link
            let button = new MessageButton()
              .setLabel(link.name)
              .setStyle("LINK")
              .setURL(link.url);
            row.addComponents(button);
            numberOfButtonsInThisRow++;

            // If we've added 5 buttons, we need to start a new row (Discord's limit is 5 buttons per row)
            if (numberOfButtonsInThisRow === 5) {
              components.push(row);
              row = new MessageActionRow();
              numberOfButtonsInThisRow = 0;
            }
          });
          // Push the last row if it has any buttons
          if (numberOfButtonsInThisRow > 0) {
            components.push(row);
          }
        }

        return interaction.reply({ embeds: [embed], ephemeral: false, components: components });
      } catch (error) {
        u.errorHandler(error, interaction);
        return interaction.reply({
          content: "Something went wrong while loading author info.",
          ephemeral: true
        }).catch(u.noop);
      }
    }
  });

module.exports = Module;
