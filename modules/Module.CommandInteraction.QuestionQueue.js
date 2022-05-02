const Augur = require("augurbot"),
    u = require("../utils/Utils.Generic"),
    snowflakes = require('../config/snowflakes.json');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST, DiscordAPIError } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Message, MessageButton, MessageActionRow } = require('discord.js');
const askedRecently = new Set();

function questionRowButtons(buttonOneStyle, buttonTwoStyle, buttonThreeStyle, buttonTwoEmoji, data) {
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
                .setLabel(`${(data.system.IDs.length == 0 || !data.system.IDs.length) ? 1 : data.system.IDs.length}`)
                .setStyle(buttonTwoStyle || "SECONDARY")
                .setEmoji(buttonTwoEmoji || ''),

            //add the check vote status button
            new MessageButton()
                .setCustomId('unvoteQuestion')
                .setLabel("")
                .setStyle(buttonThreeStyle || "SECONDARY")
                .setEmoji(snowflakes.emoji.unDawn),

            new MessageButton()
                .setCustomId("deleteQuestion")
                .setEmoji("🗑")
                .setStyle("SECONDARY")

        )
}

async function deleteQuestion(interaction, targetId) {

    // Load data
    files = fs.readdirSync(`./data/`).filter(x => x.endsWith(`.json`));
    let rawData = [];
    let asker;
    for (i = 0; i < files.length; i++) {
        data = JSON.parse(fs.readFileSync(`./data/${files[i]}`));
        if (data.fetch.message == targetId) asker = data.details.asker;
        rawData.push({
            file: files[i],
            fetch: data.fetch,
            string: `<@${data.details.asker}>: ${data.details.question}`,
            votes: data.system.IDs.length
        });
    }
    let target = rawData.find(msg => msg.fetch.message == targetId);
    if (target == undefined) {
        interaction.reply({ content: `There are no questions with that ID in my memory crystals`, ephemeral: true });
        return
    }
    target = [target];
    //permissions check
    if (!interaction.member.roles.cache.has(snowflakes.roles.Admin) && !interaction.member.roles.cache.has(snowflakes.roles.Whisper) && !interaction.member.roles.cache.has(snowflakes.roles.BotMaster) && !interaction.member.roles.cache.has(snowflakes.roles.LARPer) && interaction.user.id != asker) {
        interaction.reply({ content: "Radiance cannot permit you to do that", ephemeral: true });
        return;
    }
    // Check
    if (rawData.length == 0) {
        interaction.reply({ content: `There are no questions to delete! Check back later.`, ephemeral: true });
        return;
    }

    //allow LARPers to remove questions that have already been asked
    if (interaction.member.roles.cache.has(snowflakes.roles.LARPer)) {
        interaction.reply({ content: `I have moved ${target[0].string ? target[0].string : target[0]} to the question discussion channel`, ephemeral: true });
        let newResponseChannel = interaction.guild.channels.cache.get(snowflakes.channels.questionDiscussion)
        let newEmbed = interaction.message.embeds[0]
        newResponseChannel.send({content: `<@${asker}>, ${interaction.member.displayName} flagged your question as either already answered, or answerable by the community. They should provide you with more information as a response to this message.`, embeds:[newEmbed], allowedMentions: {parse: ["users"]} })
    }

    else {
        interaction.reply({ content: `I have removed ${target[0].string ? target[0].string : target[0]}`, ephemeral: true });

        //allow the asker to send again
        if (askedRecently.has(asker)) {
            askedRecently.delete(asker);
        }
    }


    // Delete vote messages
    c = await Module.client.guilds.cache.get(snowflakes.guilds.PrimaryServer).channels.fetch(snowflakes.channels.ask);
    for (i = 0; i < target.length; i++) {
        fs.unlinkSync(`./data/${target[i].file}`);
        try {
            m = await c.messages.fetch(target[i].fetch.message);

        } catch (error) {
            if (error.toString().indexOf("Unknown Message") > -1) {
                u.errorHandler("That question has been deleted")
            }
        }

        if (m) m.delete().catch(err => u.errorHandler(`ERR: Insufficient permissions to delete messages.`));
    }

}


async function ask(interaction) {
    const hoursBetweenQuestions = 3;

    if (interaction instanceof Message) {
        // correct channel?
        if (interaction.channel.id != snowflakes.channels.ask) {
            await interaction.reply({ content: `You can't do that here. Try in <#${snowflakes.channels.ask}>`, ephemeral: true });
            return;
        }
        //make sure the object has the correct structure
        interaction.user = interaction.author
        //Akn
        await interaction.react("👍");
        u.clean(interaction, 3);
    }
    if (askedRecently.has(interaction.user.id)) {
        interaction.reply({ content: "Wait a few hours before asking again. - <@" + interaction.user + ">\nYour question was: " + (interaction.options ? interaction.options.get("question").value : interaction.cleanContent), ephemeral: true });
    } else {
        // Akn
        try {
            u.clean(await interaction.reply({ content: 'Thank you. Your question has been registered.', ephemeral: true }));
        } catch (error) {
            u.noop();
        }


        // Write JSON
        let data = {
            details: {
                asker: interaction.user.id,
                question: interaction.options ? interaction.options.get("question").value : interaction.cleanContent,
                number: ""
            },
            fetch: {
                channel: snowflakes.channels.ask,
                message: ""
            },
            system: {
                IDs: [
                    Module.client.user.id
                ],
                entered: Date.now()
            }
        }


        // Reply
        embed = u.embed()
            .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL())
            .setDescription(interaction.options ? interaction.options.get("question").value : interaction.cleanContent)
            .setFooter(`Question ${(fs.readdirSync(`./data/`).filter(t => t.endsWith(`.json`)).length + 1)}`)
            .setTimestamp()
            .setColor(interaction.guild ? interaction.guild.members.cache.get(interaction.client.user.id).displayHexColor : "000000");
        let row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", data)
        let msg = await interaction.guild.channels.cache.get(snowflakes.channels.ask).send({ embeds: [embed], components: [row] });

        data = {
            details: {
                asker: interaction.user.id,
                question: interaction.options ? interaction.options.get("question").value : interaction.cleanContent,
                number: (msg.id)
            },
            fetch: {
                channel: snowflakes.channels.ask,
                message: msg.id
            },
            system: {
                IDs: [
                    Module.client.user.id
                ],
                entered: Date.now()
            }
        }

        console.log(`${interaction.user.tag} asked:\n\t${data.details.question}\n\nID:${data.fetch.message}\n\n\n`)
        fs.writeFileSync(`./data/${msg.id}.json`, JSON.stringify(data, null, 4));

        // Adds the user to the set so that they can't ask for a few hours
        if (!interaction.member.roles.cache.has(snowflakes.roles.Admin) && !interaction.member.roles.cache.has(snowflakes.roles.Whisper) && !interaction.member.roles.cache.has(snowflakes.roles.BotMaster)) {
            askedRecently.add(interaction.user.id);
            setTimeout(() => {
                // Removes the user from the set after 3 hours
                askedRecently.delete(interaction.user.id);
            }, hoursBetweenQuestions * 60 * 60 * 1000);
        }
    }
}


const Module = new Augur.Module()
    .addInteractionCommand({
        name: "ask",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {
            ask(interaction);
        }
    }).addInteractionHandler({
        customId: "upVoteQuestion",
        process: async (interaction) => {
            // Check & Load data
            if (!fs.existsSync(`./data/${interaction.message.id}.json`)) return;
            let data = JSON.parse(fs.readFileSync(`./data/${interaction.message.id}.json`));

            // Already voted?
            if (data.system.IDs.includes(interaction.user.id)) {
                msg = await interaction.channel.messages.fetch(interaction.message.id);
                row = questionRowButtons("DANGER", "SECONDARY", "SECONDARY", "", data);
                msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });

            } else {
                data.system.IDs.push(interaction.user.id);
                fs.writeFileSync(`./data/${interaction.message.id}.json`, JSON.stringify(data, null, 4));
            }

            // Update message with new count
            msg = await interaction.channel.messages.fetch(interaction.message.id);
            row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", data);
            msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });

            // Respond
            interaction.deferUpdate();
        }
    }).addInteractionHandler({
        customId: "deleteQuestion",
        process: async (interaction) => {
            let target = [interaction.message.id];
            deleteQuestion(interaction, target);
        }
    }).addInteractionHandler({
        customId: "voteCheck",
        process: async (interaction) => {
            // Check & Load data
            if (!fs.existsSync(`./data/${interaction.message.id}.json`)) return;
            let data = JSON.parse(fs.readFileSync(`./data/${interaction.message.id}.json`));

            // Already voted?
            if (data.system.IDs.includes(interaction.user.id)) {
                msg = await interaction.channel.messages.fetch(interaction.message.id);
                row = questionRowButtons("SECONDARY", "SUCCESS", "SECONDARY", "✅", data)
                msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });
            } else {
                msg = await interaction.channel.messages.fetch(interaction.message.id);
                row = questionRowButtons("SECONDARY", "DANGER", "SECONDARY", "❌", data);
                msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });
            }

            // Update message with new count
            msg = await interaction.channel.messages.fetch(interaction.message.id);
            row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", data);

            let author = interaction.guild.members.cache.get(data.details.asker)
            
            msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question).setAuthor({name: author ? author.displayName : "unknown user", iconURL: author? author.displayAvatarURL() : "https://www.seekpng.com/png/full/9-96714_question-mark-png-question-mark-black-png.png"})], components: [row] });

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
                data.system.IDs = data.system.IDs.filter((id) => (id != interaction.user.id && id != null));
                fs.writeFileSync(`./data/${interaction.message.id}.json`, JSON.stringify(data, null, 4));
            } else {
                msg = await interaction.channel.messages.fetch(interaction.message.id);
                row = questionRowButtons("SECONDARY", "SECONDARY", "DANGER", "", data);
                msg.edit({ embeds: [msg.embeds[0].setDescription(data.details.question)], components: [row] });
            }

            // Update message with new count
            msg = await interaction.channel.messages.fetch(interaction.message.id);
            row = questionRowButtons("SECONDARY", "SECONDARY", "SECONDARY", "", data);
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
                //ensure data has minimum required feilds.
                if (data && data.system && data.system.IDs && data.fetch && data.details && data.details.asker && data.details.question) {
                    rawData.push({
                        file: files[i],
                        fetch: data.fetch,
                        string: `<@${data.details.asker}>: ${data.details.question}`,
                        votes: data.system.IDs.length
                    });
                }
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
                let m = false;
                try {
                    m = await c.messages.fetch(accepted[i].fetch.message);
                } catch (error) {
                    if (error.toString().indexOf("Unknown Message") > -1) {
                        u.errorHandler("That question has been deleted")
                    }
                }

                if (m) m.delete().catch(err => u.errorHandler(`ERR: Insufficient permissions to delete messages.`));
            }

        }

    }).addInteractionCommand({
        name: "question-remove",
        guildId: snowflakes.guilds.PrimaryServer,
        process: async (interaction) => {
            let targetId = interaction?.options?.get("id")?.value;
            deleteQuestion(interaction, targetId)
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
                    votes: data.system.IDs.length
                });
            }

            // Sort
            sorted = rawData.sort((a, b) => (a.votes < b.votes) ? 1 : -1);
            statEmbed.addField("Total questions", "`" + sorted.length + "`");
            // Check
            if (sorted.length == 0) {
                statEmbed.addField("Top Questions:", "`There are no questions in the Queue`")
                interaction.reply({ embeds: [statEmbed] });
                return
            }

            for (i = 0; i < numberOfQuestions; i++) {
                if (sorted[i]) {
                    statEmbed.addField("Top Question " + (i + 1) + ":" + "( " + sorted[i].votes + " votes)", sorted[i].string.substring(0, 1000));
                }
            }
            // Send
            interaction.reply({ embeds: [statEmbed] });
        }

    }).addEvent("messageCreate", async (msg) => {
        if (msg.author.bot || msg.channel.id != snowflakes.channels.ask) return;
        ask(msg);
    });


module.exports = Module;