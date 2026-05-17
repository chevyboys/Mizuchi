const { AugurClient } = require("augurbot"),
  anathemaConfig = require("./config/config_anathema.json"),
  fs = require("fs"),
  u = require("./utils/Utils.Generic");
anathemaConfig.snowflakes = require("./config/snowflakes_anathema.json");


const anathema_options = {
  clientOptions: {
    allowedMentions: {
      parsed: ["roles", "users"],
      repliedUser: true
    },
    partials: ["CHANNEL", "MESSAGE", "REACTION"]
  },
  commands: [
    "./modules_anathema",
    "./modules_common"
  ],
  errorHandler: u.errorHandler,
  parse: u.parse
};

let anathemaClient = new AugurClient(anathemaConfig, anathema_options).setMaxListeners(80);

function fixCacheRaceCondition(botClient, moduleFolders) {
  botClient.once("ready", async () => {
    try {
      console.log(`[${botClient.user.username}] Fetching global commands to fix Augur cache...`);

      // 1. Force discord.js to download the commands so Augurbot can see them
      await botClient.application.commands.fetch();

      console.log(`[${botClient.user.username}] Cache populated! Reloading modules to map handlers...`);

      // 2. Read your module folders and reload the JS files
      for (const folder of moduleFolders) {
        if (fs.existsSync(folder)) {
          const files = fs.readdirSync(folder).filter(f => f.endsWith('.js'));
          for (const file of files) {
            try {
              // Augurbot's reload function accepts the filename
              botClient.moduleHandler.reload(`${folder}/${file}`);
            } catch (err) {
              // Ignore files that aren't modules or fail to reload
            }
          }
        }
      }

      console.log(`[${botClient.user.username}] All handlers successfully mapped!`);
    } catch (error) {
      console.error(`Error fixing cache race condition for ${botClient.user?.username}:`, error);
    }
  });
}


function reloadClient(e) {
  anathemaClient.destroy();
  anathemaClient = new AugurClient(anathemaConfig, anathema_options).setMaxListeners(80);
  fixCacheRaceCondition(anathemaClient, anathema_options.commands);
  anathemaClient.login();
  e.name = "Attempted to rebuild client because of " + e.name;
  e.message = "Action Taken! \nAttempted to rebuild client because of:\n\n " + e.message;
  u.errorHandler(e, "Handled Rejection");
  return;
}




fixCacheRaceCondition(anathemaClient, anathema_options.commands);
u.get_log_webhook(anathemaClient, anathemaConfig.identifier).send({ embeds: [u.embed().setColor("BLUE").setDescription("Initialization complete")] });
anathemaClient.login();




// Helper function to figure out which bot caused the global error
function determineBotFromError(error) {
  return "anathema";
}


//Error handling and startup verification


$errorCounter = [];

// LAST DITCH ERROR HANDLING
process.on("unhandledRejection", (error, p) => p.catch((e) => {
  $errorCounter[e.message] = $errorCounter[e.message] ? $errorCounter[e.message] + 1 : 1;

  // Sleuth the bot name from the stack trace!
  const culpritBot = determineBotFromError(e);

  // if ($errorCounter[e.message] > 5 && $errorCounter[e.message] < 6) {
  //   e.name = "Frequent Error: " + e.name;
  //   e.message = "This error has occurred more than 5 times:\n\n" + e.message;
  //   reloadClient(e);
  //   return;
  // } else if ($errorCounter[e.message] > 6) {
  //   // end the process if it keeps happening and let linux restart it to avoid infinite loops and recover to a stable state
  //   e.name = "Excessive Frequent Error: " + e.name;
  //   e.message = "This error has occurred more than 6 times, ending process to allow restart:\n\n" + e.message;
  //
  //   // Pass the culprit bot here
  //   return u.errorHandler(e, "Unhandled Rejection - Process Ending", culpritBot).then(() => process.exit(1));
  // }


  // Pass the culprit bot here
  if (culpritBot) {
    u.errorHandler(e, "Unhandled Rejection", culpritBot);
  } else {
    u.errorHandler(e, "Unhandled Rejection", "anathema");
  }
}));

process.on("uncaughtException", (error) => {
  // Sleuth the bot name and pass it!
  const culpritBot = determineBotFromError(error);
  if (culpritBot) {
    u.errorHandler(error, "Uncaught Exception", culpritBot);
  } else {
    u.errorHandler(error, "Uncaught Exception", "anathema");
  }
});

module.exports = { anathemaClient };