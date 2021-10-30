const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder();
data.setName("guild")
.setDescription("Meta commands for moderators to use on the guild.")
.addSubcommand(subcommand => 
    subcommand.setName("lock")
    .setDescription("toggles permissions for the @everyone role to send messages in the guild or in threads")
    )
.addSubcommand(subcommand => 
    subcommand.setName("slow")
        .setDescription("sets default slowmode to all channels that don't override")
        .addBooleanOption(option => option.setRequired(true).setName("slowmode").setDescription("do you want slow mode on?"))
);
data.defaultPermission = true;
console.log(data);

module.exports = {data};