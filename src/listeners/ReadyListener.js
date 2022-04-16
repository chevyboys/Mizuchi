const { Listener } = require('@sapphire/framework');
const U = require("../utilities/General")
const snowflakes = require("../../config/snowflakes.json");

class ReadyListener extends Listener {
    constructor(context, options) {
        super(context, {
            ...options,
            once: false,
            event: 'ready'
        });
    }
    run(client) {
        const { username, id } = client.user;
        console.log(`Successfully logged in as ${username} (${id})`);
        U.PrimaryServer = client.guilds.cache.get(snowflakes.guilds.PrimaryServer) || this.client.guilds.fetch(snowflakes.guilds.PrimaryServer);
        U.client = client;
    }
}

module.exports = {
    ReadyListener
};