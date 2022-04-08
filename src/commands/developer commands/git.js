const { Command, CommandOptionsRunTypeEnum } = require('@sapphire/framework');
const u = require('../../utilities/General');

class GitCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'git',
      aliases: ['pull', 'stash'],
      description: "Pulls the latest code from the github",
      preconditions: ["BotAdmin"],
      runIn: CommandOptionsRunTypeEnum.GuildAny,
      requiredUserPermissions: [],
      requiredClientPermissions: [],
    });
  }
  /**
   * 
   * @param {Message} msg 
   */
  async messageRun(msg) {
    let spawn = require("child_process").spawn;

    u.clean(msg);

    let cmd;
    if (msg.content.toLowerCase().indexOf("pull") > -1) {
      cmd = spawn("git", ["pull"], { cwd: process.cwd() });
    }
    else if (msg.content.indexOf("stash") > -1) {
      cmd = spawn("git", ["stash"], { cwd: process.cwd() });
    }

    let stdout = [];
    let stderr = [];

    cmd.stdout.on("data", data => {
      stdout.push(data);
    });

    cmd.stderr.on("data", data => {
      stderr.push(data);
    });

    cmd.on("close", code => {
      if (code == 0)
        return msg.channel.send(stdout.join("\n") + "\n\nCompleted with code: " + code).then(u.clean);
      else
        return msg.channel.send(`ERROR CODE ${code}:\n${stderr.join("\n")}`).then(u.clean);
    });
  }

}


module.exports = {
  GitCommand
};