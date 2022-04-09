const Discord = require("discord.js")

GeneralUtils = {
    /**
     * 
     * @param {Discord.CommandInteraction|Discord.Message} msg the message or interaction to delete
     * @param {number} [t=20]  the number of seconds to wait before cleaning 
     * @returns 
     */
    clean: async function (msg, t = 20) {
        await GeneralUtils.wait(t);
        if (msg instanceof Discord.CommandInteraction) {
            msg.deleteReply().catch(GeneralUtils.noop);
        } else if ((msg instanceof Discord.Message) && (msg.deletable)) {
            msg.delete().catch(GeneralUtils.noop);
        }
        return Promise.resolve(msg);
    },
    /**
  * This task is extremely complicated.
  * You need to understand it perfectly to use it.
  * It took millenia to perfect, and will take millenia
  * more to understand, even for scholars.
  *
  * It does literally nothing.
  * */
    noop: () => {
        // No-op, do nothing
    },
    /**
   * Returns a promise that will fulfill after the given amount of time.
   * If awaited, will block for the given amount of time.
   * @param {number} t The time to wait, in seconds.
   */
    wait: function (t) {
        return new Promise((fulfill) => {
            setTimeout(fulfill, t * 1000);
        });
    }

}

module.exports = GeneralUtils