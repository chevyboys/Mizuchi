const Augur = require("augurbot"),
  u = require("../utils/Utils.Generic"),
  minecraft = require("../utils/minecraftAPI");

const Module = new Augur.Module()
  .addCommand({
    name: "minecraftskin",
    description: "Gets the Minecraft skin of a user.",
    syntax: "[@user]",
    category: "Minecraft",
    process: async (msg, suffix) => {
      let name = encodeURIComponent(suffix);

      try {
        let uuid;
        try {
          uuid = await minecraft.getPlayerUUID(name);
        } catch (error) { u.noop(); }
        if (!uuid) {
          msg.channel.send("I couldn't find a Minecraft account with the username `" + name + "`.").then(u.clean);
          return;
        }

        // The "body" part of this has other options for other skin views, that can be implemented later.
        // let skinUrl = `https://crafatar.com/renders/body/${uuid}?overlay=true`;
        let skinUrl = `https://visage.surgeplay.com/full/512/${uuid}`;
        msg.channel.send({ files: [{ attachment: skinUrl, name: `${name}.png` }] });
      } catch (e) { u.errorHandler(e, msg); }
    }
  });

module.exports = Module;