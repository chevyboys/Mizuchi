const { AugurClient } = require("augurbot"),
  config = require("./config/config.json"),
  u = require("./utils/Utils.Generic");

const options = {
  clientOptions: {
    allowedMentions: {
      parsed: ["roles", "users"],
      repliedUser: true
    },
    partials: ["CHANNEL", "MESSAGE", "REACTION"]
  },
  commands: "./modules",
  errorHandler: u.errorHandler,
  parse: u.parse
};

let client = new AugurClient(config, options).setMaxListeners(80);

client.login();


function reloadClient(e) {
  client.destroy();
  client = new AugurClient(config, options).setMaxListeners(80);
  client.login();
  e.name = "Attempted to rebuild client because of " + e.name;
  e.message = "Action Taken! \nAttempted to rebuild client because of:\n\n " + e.message;
  u.errorHandler(e, "Handled Rejection");
  return;
}

$errorCounter = [];

// LAST DITCH ERROR HANDLING
process.on("unhandledRejection", (error, p) => p.catch((e) => {
  $errorCounter[e.message] = $errorCounter[e.message] ? $errorCounter[e.message] + 1 : 1;
  if ($errorCounter[e.message] > 5 && $errorCounter[e.message] < 6) {
    e.name = "Frequent Error: " + e.name;
    e.message = "This error has occurred more than 5 times:\n\n" + e.message;
    reloadClient(e);
    return
  } else if ($errorCounter[e.message] > 6) {
    // end the process if it keeps happening and let PM2 restart it to avoid infinite loops and recover to a stable state
    e.name = "Excessive Frequent Error: " + e.name;
    e.message = "This error has occurred more than 6 times, ending process to allow restart:\n\n" + e.message;
    return u.errorHandler(e, "Unhandled Rejection - Process Ending").then(() => process.exit(1));
  }

  if (e.message.includes("Request to use token, but token was unavailable to the client")) {
    return reloadClient(e);
  }
  u.errorHandler(e, "Unhandled Rejection");
}));
process.on("uncaughtException", (error) => u.errorHandler(error, "Uncaught Exception"));

module.exports = client;
