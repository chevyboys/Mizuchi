const Augur = require("augurbot"),
    u = require("../utils/utils"),
    snowflakes = require('../config/snowflakes.json');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST, DiscordAPIError } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, MessageEmbed, Intents, MessageButton, MessageActionRow } = require('discord.js');
const { raw } = require("express");
const { embed } = require("../utils/utils");

function questionRowButtons(buttonOneStyle, buttonTwoStyle, buttonThreeStyle, buttonTwoEmoji) {
    return new MessageActionRow()
        .addComponents(
            //add the upvote button
            new MessageButton()
                .setCustomId('upVoteQuestion')
                .setLabel(``)
                .setStyle(buttonOneStyle || "SECONDARY")
                .setEmoji(snowflakes.emoji.upDawn),

            new MessageButton()
                .setCustomId('voteCheck')
                .setLabel(`${(data.system.votes == 0 || !data.system.votes) ? 1 : data.system.votes}`)
                .setStyle(buttonTwoStyle || "SECONDARY")
                .setEmoji(buttonTwoEmoji || ''),

            //add the check vote status button
            new MessageButton()
                .setCustomId('unvoteQuestion')
                .setLabel("")
                .setStyle(buttonThreeStyle || "SECONDARY")
                .setEmoji(snowflakes.emoji.unDawn)

        )
}

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
            row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "")
            msg = await interaction.channel.send({ embeds: [embed], components: [row] });

            // Write JSON
            data = {
                details: {
                    asker: interaction.user.id,
                    question: interaction.options.get("question").value,
                    number: (msg.id)
                },
                fetch: {
                    channel: interaction.channel.id,
                    message: msg.id
                },
                system: {
                    votes: 1,
                    IDs: [
                        Module.client.user.id
                    ],
                    entered: Date.now()
                }
            }
            console.log(`${interaction.user.tag} asked:\n\t${data.details.question}\n\nID:${data.fetch.message}\n\n\n`)
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
                msg = await interaction.channel.messages.fetch(interaction.message.id);
                row = questionRowButtons("DANGER", "SECONDARY", "SECONDARY", "");
                msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });
                
            } else {
                data.system.votes += 1;
                data.system.IDs.push(interaction.user.id);
                fs.writeFileSync(`./data/${interaction.message.id}.json`, JSON.stringify(data, null, 4));
            }
            
            // Update message with new count
            msg = await interaction.channel.messages.fetch(interaction.message.id);
            row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "");
            msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });

            // Respond
            interaction.deferUpdate();
        }
    }).addInteractionHandler({
        customId: "voteCheck",
        process: async (interaction) => {
            // Check & Load data
            if (!fs.existsSync(`./data/${interaction.message.id}.json`)) return;
            data = JSON.parse(fs.readFileSync(`./data/${interaction.message.id}.json`));

            // Already voted?
            if (data.system.IDs.includes(interaction.user.id)) {
                msg = await interaction.channel.messages.fetch(interaction.message.id);
                row = questionRowButtons("SECONDARY", "SUCCESS", "SECONDARY", "✅")
                msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });
            } else {
                msg = await interaction.channel.messages.fetch(interaction.message.id);
                row = questionRowButtons("SECONDARY", "DANGER", "SECONDARY", "❌");
                msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });
            }

            // Update message with new count
            msg = await interaction.channel.messages.fetch(interaction.message.id);
            row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "");
            msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });

            // Respond
            interaction.deferUpdate();
        }
    })
    .addInteractionHandler({
        customId: "unvoteQuestion",
        process: async (interaction) => {
            // Check & Load data
            if (!fs.existsSync(`./data/${interaction.message.id}.json`)) return;
            data = JSON.parse(fs.readFileSync(`./data/${interaction.message.id}.json`));

            // Already voted?
            if (data.system.IDs.includes(interaction.user.id)) {
                data.system.votes -= 1;
                data.system.IDs = data.system.IDs.filter((id) => (id != interaction.user.id && id != null));
                fs.writeFileSync(`./data/${interaction.message.id}.json`, JSON.stringify(data, null, 4));
            } else {
                msg = await interaction.channel.messages.fetch(interaction.message.id);
                row = questionRowButtons("SECONDARY", "SECONDARY", "DANGER",  "");
                msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });
            }

            // Update message with new count
            msg = await interaction.channel.messages.fetch(interaction.message.id);
            row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "");
            msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });

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
            rawData = [];
            for (i = 0; i < files.length; i++) {
                data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
                rawData.push({
                    file: files[i],
                    fetch: data.fetch,
                    string: `<@${data.details.asker}>: ${data.details.question}`,
                    votes: data.system.votes
                });
            }

            // Sort
            sorted = rawData.sort((a, b) => (a.votes < b.votes) ? 1 : -1);

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
                interaction.channel.send({ content: strings.substring(0, 2000) });
                strings = strings.substring(2000);
            }
            interaction.reply({ content: `${strings}` });

            // Delete vote messages
            c = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.fetch(snowflakes.channels.ask);
            for (i = 0; i < accepted.length; i++) {
                fs.unlinkSync(`./data/${accepted[i].file}`);
                try {
                    m = await c.messages.fetch(accepted[i].fetch.message);
                } catch (error) {
                    if (error.toString().indexOf("Unknown Message") > -1) {
                        u.errorLog("That question has been deleted")
                    }
                }

                if (m) m.delete().catch(err => u.errorLog(`ERR: Insufficient permissions to delete messages.`));
            }

        }

    }).addInteractionCommand({
        name: "question-remove",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {

            // Load data
            files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
            let rawData = [];
            for (i = 0; i < files.length; i++) {
                data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
                rawData.push({
                    file: files[i],
                    fetch: data.fetch,
                    string: `<@${data.details.asker}>: ${data.details.question}`,
                    votes: data.system.votes
                });
            }

            // Check
            if (rawData.length == 0) {
                interaction.reply({ content: `There are no questions to delete! Check back later.`, ephemeral: true });
                return
            }
            let targetId = interaction?.options?.get("id")?.value;
            let target = rawData.find(msg => msg.fetch.message == targetId);
            if (target == undefined) {
                interaction.reply({ content: `There are no questions with that ID in my memory crystals`, ephemeral: true });
                return
            }
            target = [target];
            interaction.reply({ content: `I have removed ${target[0].string}`, ephemeral: true });



            // Delete vote messages
            c = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.fetch(snowflakes.channels.ask);
            for (i = 0; i < target.length; i++) {
                fs.unlinkSync(`./data/${target[i].file}`);
                try {
                    m = await c.messages.fetch(target[i].fetch.message);

                } catch (error) {
                    if (error.toString().indexOf("Unknown Message") > -1) {
                        u.errorLog("That question has been deleted")
                    }
                }

                if (m) m.delete().catch(err => u.errorLog(`ERR: Insufficient permissions to delete messages.`));
            }

        }

    }).addInteractionCommand({
        name: "question-stats",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {

            let statEmbed = u.embed().setTitle("Question Queue Stats").setColor(interaction.guild ? interaction.guild.members.cache.get(interaction.client.user.id).displayHexColor : "000000")

            let numberOfQuestions = 5
            // Load data
            files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
            rawData = [];
            for (i = 0; i < files.length; i++) {
                data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
                rawData.push({
                    file: files[i],
                    fetch: data.fetch,
                    string: `<@${data.details.asker}>: ${data.details.question}`,
                    votes: data.system.votes
                });
            }

            // Sort
            sorted = rawData.sort((a, b) => (a.votes < b.votes) ? 1 : -1);
            statEmbed.addField("Total questions", "`"+ sorted.length+ "`");
            // Check
            if (sorted.length == 0) {
                statEmbed.addField("Top Questions:", "`There are no questions in the Queue`")
                interaction.reply({ embeds: [statEmbed]  });
                return
            }

            for (i = 0; i < numberOfQuestions; i++) {
                if (sorted[i]) {
                    statEmbed.addField("Top Question " + i + ":" + "( " + sorted[i].system.votes + " votes)", sorted[i].string.substring(0, 1000));
                }
            }
            // Send
            interaction.reply({ embeds: [statEmbed]  });
        }

    });


module.exports = Module;