import { SlashCommandComponent } from "chironbot";
import { SlashCommandBuilder } from "discord.js";
import { DbGuild, DbGuildChannels } from "../../utils/Database/DbGuild";
import { EmbedBuilder } from "@discordjs/builders";
let guildChannelsBuilder = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('sets the guild up in the database')
    .addSubcommand((subcommand) => {
    subcommand
        .setName('channels')
        .setDescription('sets the channels for the guild');
    for (const key in DbGuild.prototype.channels) {
        subcommand.addChannelOption(option => option.setName(key).setDescription("The channel you would like to set as the " + key));
    }
    return subcommand;
});
let subcommandChannelsProccess = async (interaction) => {
    if (!interaction.guildId)
        return console.error("no guild id");
    if (!interaction.guild)
        return console.error("no guild");
    let selectedChannels = new DbGuildChannels();
    for (const key in DbGuild.prototype.channels) {
        interaction.options.getChannel(key) ? selectedChannels[key] = interaction.options.getChannel(key)?.id : null;
    }
    let guild = await DbGuild.get(interaction.guildId) || await DbGuild.create(interaction.guild);
    guild.setChannels(selectedChannels);
    guild = await DbGuild.get(interaction.guildId);
    let embed = new EmbedBuilder()
        .setTitle("Channel Setup")
        .setDescription("The channels have been set to the following:\n" + JSON.stringify(guild.channels, null, 2))
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
