const Augur = require("augurbot"),
    u = require("../utils/utils"),
    snowflakes = require('../config/snowflakes.json');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST, DiscordAPIError } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, MessageEmbed, Intents, MessageButton, MessageActionRow } = require('discord.js');

const Module = new Augur.Module()
    .addInteractionCommand({
        name: "ask",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {
            // correct channel?
            if (interaction.channel.id != snowflakes.channels.ask) {
                await interaction.reply({ content: `You can't do that here. Try in <#${snowflakes.channels.ask}>`, ephemeral: true });
                return;
            }

            // Akn
            await interaction.reply({ content: 'Thank you. Your question has been registered.', ephemeral: true });

            // Reply
            embed = u.embed()
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL())
                .setDescription(interaction.options.get("question").value)
                .setFooter(`Question ${(fs.readdirSync(`./data/`).filter(t => t.endsWith(`.json`)).length + 1)}`)
                .setTimestamp()
                .setColor(interaction.guild ? interaction.guild.members.cache.get(interaction.client.user.id).displayHexColor : "000000");
            row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('upVoteQuestion')
                        .setLabel(`0`)
                        .setStyle('SECONDARY')
                        .setEmoji(snowflakes.emoji.upDawn),
                )
            msg = await interaction.channel.send({ embeds: [embed], components: [row] });

            // Write JSON
            data = {
                details: {
                    asker: interaction.user.id,
                    question: interaction.options.get("question").value,
                    number: (fs.readdirSync(`./data/`).filter(t => t.endsWith(`.json`)).length + 1)
                },
                fetch: {
                    channel: interaction.channel.id,
                    message: msg.id
                },
                system: {
                    votes: 0,
                    IDs: [],
                    entered: Date.now()
                }
            }
            fs.writeFileSync(`./data/${msg.id}.json`, JSON.stringify(data, null, 4));
        }

    }).addInteractionHandler({
        customId: "upVoteQuestion",
        process: async (interaction) => {
            // Check & Load data
            if (!fs.existsSync(`./data/${interaction.message.id}.json`)) return;
            data = JSON.parse(fs.readFileSync(`./data/${interaction.message.id}.json`));

            // Already voted?
            if (data.system.IDs.includes(interaction.user.id)) {
                data.system.votes -= 1;
                data.system.IDs = data.system.IDs.filter((id) => (id != interaction.user.id && id != null));
            } else {
                data.system.votes += 1;
                data.system.IDs.push(interaction.user.id);
            }
            fs.writeFileSync(`./data/${interaction.message.id}.json`, JSON.stringify(data, null, 4));

            // Update message with new count
            msg = await interaction.channel.messages.fetch(interaction.message.id);
            row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('upVoteQuestion')
                        .setLabel(`${data.system.votes}`)
                        .setStyle('SECONDARY')
                        .setEmoji(snowflakes.emoji.upDawn),
                )
            msg.edit({ embeds: [msg.embeds[0]], components: [row] });

            // Respond
            interaction.deferUpdate();
        }
    }).addInteractionCommand({
        name: "transfer",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {
            
            // correct channel?
            if (interaction.channel.id != snowflakes.channels.transfer) {
                await interaction.reply({ content: `You can't do that here. Try in <#${snowflakes.channels.transfer}>`, ephemeral: true });
                return;
            }
            let numberOfQuestions = interaction?.options?.get("questions")?.value || 5
            // Load data
            files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
            raw = [];
            for (i = 0; i < files.length; i++) {
                data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
                raw.push({
                    file: files[i],
                    fetch: data.fetch,
                    string: `<@${data.details.asker}>: ${data.details.question}`,
                    votes: data.system.votes
                });
            }

            // Sort
            sorted = raw.sort((a, b) => (a.votes < b.votes) ? 1 : -1);

            // Check
            if (sorted.length == 0) {
                interaction.reply({ content: `There are no questions to answer! Check back later.` });
                return
            }

            // Format
            strings = [];
            accepted = [];
            for (i = 0; i < numberOfQuestions; i++) {
                if (sorted[i]) {
                    strings.push(sorted[i].string);
                    accepted.push(sorted[i]);
                }
            }
            strings = strings.join(`\n\n`);
            // Send
            while (strings.length > 2000) {
                interaction.channel.send({ content:strings.substring(0, 2000)});
                strings = strings.substring(2000);
            }
            interaction.reply({ content: `${strings}` });

            // Delete vote messages
            c = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.fetch(snowflakes.channels.ask);
            for (i = 0; i < accepted.length; i++) {
                fs.unlinkSync(`./data/${accepted[i].file}`);
                m = await c.messages.fetch(accepted[i].fetch.message);
                if (m) m.delete().catch(err => u.errorLog(`ERR: Insufficient permissions to delete messages.`));
            }

        }

    });


module.exports = Module;