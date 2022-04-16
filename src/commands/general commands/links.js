const { ApplicationCommandRegistry, Command, RegisterBehavior, CommandOptionsRunTypeEnum } = require("@sapphire/framework"),
    { SlashCommandBuilder } = require("@discordjs/builders"),
    snowflakes = require("../../../config/snowflakes.json");
const { CommandInteraction } = require("discord.js");



class CustomCommand extends Command {
    constructor(context, options) {
        super(context, {
          ...options,
          name: 'links',
          description: "shows various helpful links for things around the fandom",
          preconditions: ["BotAdmin"],
          runIn: CommandOptionsRunTypeEnum.GuildAny,
          requiredUserPermissions: [],
          /*//requiredClientPermissions: ["SEND_MESSAGES", "ADD_REACTIONS"],*/
        });
      }
    /**
     * register a command
     * @param {ApplicationCommandRegistry} [registry] the 
     */
    registerApplicationCommands(registry = ApplicationCommandRegistry) {
        const builder = new SlashCommandBuilder()
            //set up slash command structure
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption(option => {
                option.setAutocomplete(true)
            })
        registry.registerChatInputCommand(builder, {
            behaviorWhenNotIdentical: RegisterBehavior.Overwrite
        });
        //for help registering commands, see https://vladfrangu.notion.site/Application-Command-Registry-e1be0c1022bc429f8aab6fb92cd3915d
    }

    /**
     * what to do when an interaction is received
     * @param {CommandInteraction} interaction 
     */
    chatInputRun(interaction = CommandInteraction) {
        interaction.reply("test successful")
    }

}


module.exports = CustomCommand