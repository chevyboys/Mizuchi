import { SlashCommandComponent } from "chironbot";
import { SlashCommandBuilder } from "discord.js";
import { DbGuild, DbGuildChannels } from "../../utils/Database/DbGuild";
import { EmbedBuilder } from "@discordjs/builders";
let keyToDiscordChannelOptionName = (key) => {
    return key.toString().replaceAll(/([A-Z])/g, '-$1').trim().toLowerCase();
};
let emptyChannels = new DbGuildChannels();
let guildChannelsBuilder = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('sets the guild up in the database')
    .addSubcommand((subcommand) => {
    subcommand
        .setName('channels')
        .setDescription('sets the channels for the guild');
    for (const key in emptyChannels) {
        if (typeof emptyChannels[key] != "string" && typeof emptyChannels[key] != "undefined" && typeof emptyChannels[key] != null && typeof emptyChannels[key] != "object")
            continue;
        subcommand.addChannelOption(option => option.setName(keyToDiscordChannelOptionName(key)).setDescription("The channel you would like to set as the " + keyToDiscordChannelOptionName(key)));
    }
    return subcommand;
});
let subcommandChannelsProccess = async (interaction) => {
    if (!interaction.guildId)
        return console.error("no guild id");
    if (!interaction.guild)
        return console.error("no guild");
    let selectedChannels = new DbGuildChannels();
    for (const key in emptyChannels) {
        interaction.options.getChannel(keyToDiscordChannelOptionName(key)) ? selectedChannels[key] = interaction.options.getChannel(keyToDiscordChannelOptionName(key))?.id : null;
    }
    let raw = await DbGuild.create(interaction.guild);
    let guild = new DbGuild(raw);
    console.log(await guild.setChannels(selectedChannels));
    let newGuild = await DbGuild.get(interaction.guildId);
    guild = new DbGuild(newGuild ? newGuild : guild);
    let embed = new EmbedBuilder()
        .setTitle("Channel Setup")
        .setDescription("The channels have been set to the following:\n" + guild.channels.toString())
        .setColor([255, 3, 5])
        .setTimestamp();
    interaction.isRepliable() ? interaction.reply({
        embeds: [
            embed
        ]
    }) : console.error("could not reply");
};
export let SetupSlashCommand = new SlashCommandComponent({
    builder: guildChannelsBuilder,
    enabled: true,
    category: "setup",
    permissions: (interaction) => {
        return interaction.memberPermissions?.has("Administrator")
            || interaction.memberPermissions?.has("ManageChannels")
            || interaction.memberPermissions?.has("ManageGuild") || false;
    },
    process: async (interaction) => {
        if (interaction.options.getSubcommand() == "channels") {
            subcommandChannelsProccess(interaction);
        }
    }
});
