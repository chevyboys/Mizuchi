const { Listener } = require('@sapphire/framework');
const U = require("../utilities/General")

class ReadyListener extends Listener {
    constructor(context, options) {
        super(context, {
            ...options,
            once: true,
            event: 'ready'
        });
    }
    run(client) {
        const { username, id } = client.user;
        U.log(`Successfully logged in as ${username} (${id})`);
    }
}

module.exports = {
    ReadyListener
};