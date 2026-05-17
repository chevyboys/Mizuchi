/**
 * @typedef {Object} ParsedInteraction
 * @property {String} command - The command issued, represented as a string.
 * @property {Array} data - Associated data for the command, such as command options or values selected.
 */

/**
 * Converts an interaction into a more universal format for error messages.
 * @param {Discord.Interaction} inter The interaction to be parsed.
 * @returns {ParsedInteraction} The interaction after it has been broken down.
 */
function parseInteraction(inter) {
  if (inter.isCommand()) {
    const commandParts = [`/${inter.commandName}`];
    let optionData = inter.options.data;
    if (optionData.length == 0) {
      return {
        command: commandParts.join(" "),
        data: optionData
      };
    }

    if (optionData[0].type == "SUB_COMMAND_GROUP") {
      commandParts.push(optionData[0].name);
      optionData = optionData[0].options;
      if (optionData.length == 0) {
        return {
          command: commandParts.join(" "),
          data: optionData
        };
      }
    }

    if (optionData[0].type == "SUB_COMMAND") {
      commandParts.push(optionData[0].name);
      optionData = optionData[0].options;
      return {
        command: commandParts.join(" "),
        data: optionData ?? []
      };
    }
  }

  if (inter.isContextMenu()) {
    return {
      command: `[Context Menu] ${inter.commandName}`,
      data: inter.options.data
    };
  }

  if (inter.isMessageComponent()) {
    const data = [{
      name: "Message",
      value: inter.message.guild ? `[Original Message](${inter.message.url})` : "(DM)"
    }];
    const command = inter.isButton() ? `[Button] ${(inter.component?.emoji?.name ?? "") + (inter.component?.label ?? "")}` : "[Select Menu]";

    if (inter.isSelectMenu()) {
      data.push({ name: "Selection", value: inter.values.join() });
    }

    return { command, data };
  }
}

module.exports = {
  parseInteraction: parseInteraction
};