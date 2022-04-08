
GeneralUtils = {
    /**
     * 
     * @param {Discord.CommandInteraction|Discord.Message} msg the message or interaction to delete
     * @param {number} [t=20]  the number of seconds to wait before cleaning 
     * @returns 
     */
    clean: async function (msg, t = 20) {
        await utils.wait(t);
        if (msg instanceof Discord.CommandInteraction) {
            msg.deleteReply().catch(utils.noop);
        } else if ((msg instanceof Discord.Message) && (msg.deletable)) {
            msg.delete().catch(utils.noop);
        }
        return Promise.resolve(msg);
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