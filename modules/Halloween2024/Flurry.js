const snowflakes = require('../../config/snowflakes.json')
const fs = require('fs');
const path = require('path');
const NPCSend = require("./NPC.js");
const u = require('../../utils/Utils.Generic.js');

const filePath = path.join(__dirname, '../../data/holiday/flurries.json');

class flurry_timer {
  constructor(channel_id, start_time, duration = 600) {
    this.channel_id = channel_id;
    this.start_time = start_time;
    this.duration = duration;
  }
}

const flurryChannels = []
const flurryBlacklist = [
  snowflakes.channels.ask,
  snowflakes.channels.blogAnnouncements,
  snowflakes.channels.earthTemple,
  snowflakes.channels.general,
  snowflakes.channels.faq,
  snowflakes.channels.introductions,
  snowflakes.channels.kesterBomb,
  snowflakes.channels.modRequests,
  snowflakes.channels.roles,
  snowflakes.channels.rules,
  snowflakes.channels.transfer,
  snowflakes.channels.secret,
  snowflakes.channels.spoilerPolicy,
  "785160606676025384",
  "443461509994119168",
  "823578704512155688",
  "823578762297081887",
  "1146810277539618906",
  "443461671789395970",
  "443461722951385090",
  "703695980897370222",
  "1290926082677280831"
]
let blizzardActive = 0;

function getFlurryTimerIndex(channel_id) {
  return flurryChannels.findIndex(flurry_timer => flurry_timer.channel_id === channel_id);
}

let Flurry = {
  //TODO: Add Flurry functions
  //IF flurries should persist between restarts, you will need to do the following:
  //- have a function that creates a file in ../../data/holiday/flurries.json if it does not exist
  //- writes any flurry information to that file
  // and separately read that file in at startup.

  /**
   * run by the controller each time the bot restarts
   */
  init: () => {
    /*
    try {
      if (!fs.existsSync(filePath)) {
        console.log("File does not exists, attempting to create file.");
        fs.writeFileSync(filepath, JSON.stringify([], null, 2), 'utf8');
      }

      const data = fs.readFileSync(filePath, 'utf8');
      flurryChannels = JSON.parse(data);
      console.log("Flurries loaded succesfully.");
    } catch (err) {
      console.error("Error loading flurries: ", err);
    }
    */
  },

  saveFlurries: () => {
    /*
    try {
      fs.writeFileSync(filePath, JSON.stringify(flurryChannels, null, 2));
    } catch (err) {
      console.error("Error saving flurries:".err);
    } */
  }
  ,
  flurryCheck: async (msg) => { //Whether or not a flurry should be started on a random message

    // check if a channel is in the blacklist
    if (flurryBlacklist.includes(msg.channel.id)) {
      return false;
    }

    // do some math
    let flurryRoll = Math.floor(Math.random() * 100);
    let flurryChance = 0;
    //let flurryMsgAuthor = msg.author.id
    let prevMessages = await msg.channel.messages.fetch({ limit: 1 });
    if (prevMessages.some((msg) => msg.createdTimestamp >= (Date.now() - (60 * 60 * 1000 * 1)))) {
      // The last message was within the last hour
      // there is no point in checking the last ten messages because the more recent messages will be more recent
      // and therefore if the 10th oldest message is from the last 2 hours, then so are the more recent messages
      // this also did not detect if there are multiple in the last hour because some just detects if any meet the criteria.
      flurryChance = 2; // 2% chance of a flurry
    }
    if (flurryChance > flurryRoll) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * Starts a flurry in a channel
   * @param {Channel} channel 
   */
  start: (channel, minutes = 10) => {
    //Check if channel is #general or book channels
    //

    if (flurryBlacklist.includes(channel.id)) {
      return false;
    }

    try {
      let flurry_idx = getFlurryTimerIndex(channel.id);

      if (flurry_idx >= 0) {
        if (flurryChannels[flurry_idx].duration > 0) {
          flurryChannels[flurry_idx].duration = flurryChannels[flurry_idx].duration + (minutes * 60 * 1000);
        }
        else {
          flurryChannels[flurry_idx].duration = (minutes * 60 * 1000);
        }
        console.log(`The Flurry in ${channel.name} has been extended!`);
      }

      flurryChannels.push(new flurry_timer(channel.id, Date.now(), minutes * 60 * 1000));
      console.log(`A Flurry has been started in ${channel.name}!`);

      NPCSend(channel, u.embed({ description: "By my power I sunder the protections on this channel! Let a stream of specters rise within it!" }));
      //u.clean(msg, 0);


      //console.log(flurryChannels[0]);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }


    /*
    let idCheck = channel.id

    if (flurryBlacklist.includes(channel.id)) {
      return false;
    } else if (flurryChannels[0].includes(channel.id)) { //flurry is currently active
      
      flurryChannels[1][flurryChannels[0].indexOf(channel.id)] += (minutes * 60);
      console.log(`The Flurry in ${channel.name} has been extended!`);
    } else {

      flurryChannels[0].push(channel.id);
      flurryChannels[1].push(Date.now + (minutes * 60));
      console.log(`A Flurry has been started in ${channel.name}!`);
    } 

    return false;
    */

  },
  /**
   * Ends a flurry in a channel
   * @param {Channel} channel 
  */
  end: (channel) => {
    // needs edited
    let flurry_idx = getFlurryTimerIndex(channel.id);
    if (flurry_idx > -1) {
      //console.log(`The Flurry in ${channel.name} has come to an end!`);
      //console.log(flurryChannels);
      flurryChannels.splice(flurry_idx, 1);
      //console.log(flurryChannels);
      return true;
    }
    console.log('No flurry in ${channel.name}.')
    return false;
    /*
    if (flurryChannels[0].includes(channel_id)) {
      flurryChannels[1].splice(flurryChannels[0].indexOf(channel_id), 1)
      flurryChannels[0].splice(flurryChannels[0].indexOf(channel_id), 1)
    }
    console.log(`The Flurry in ${channel.name} has come to an end!`)
    */

  },
  blizzard: {
    /**
     * Starts a blizzard in all channels
     * @param {Channel} channel 
     */
    start: (minutes = 10) => {
      blizzardActive = Date.now() + (minutes * 60 * 1000);
      console.log(`A Blizzard has been started in the server!`)
      return true;
    },
    /**
     * Ends a blizzard in all channels
     * @param {Channel} channel 
    */
    end: () => {
      blizzardActive = 0
      console.log(`The Blizzard in the server has come to an end!`)
      return true;
    }
  },
  /**
   * 
   * @param {Message} msg 
   * @returns {boolean} returns true if the message should have a reaction given because of a flurry. This function does not actually add the reaction, nor does it need to check if the message is spam.
   */

  reactBecauseOfFlurry: async (msg) => {

    //return false;

    // Check to end blizzards on all messages
    if (Date.now >= blizzardActive && blizzardActive > 0) {
      Flurry.blizzard.end();
    }

    if (blizzardActive > 0) {
      console.log('Blizzard during message');
      let blacklist = await flurryBlacklist.includes(msg.channel.id);
      console.log(blacklist);
      return !(blacklist);
    }


    // Check to see if the message is in a channel with a flurry
    let flurry_idx = getFlurryTimerIndex(msg.channel.id);

    console.log("FID: " + flurry_idx);
    console.log("date: " + Date.now());

    if (flurry_idx > -1) {
      if (Date.now() > (flurryChannels[flurry_idx].start_time + flurryChannels[flurry_idx].duration)) {
        Flurry.end(msg.channel);
        return false;
      }

      return true;
    }

    return false;

    /*
    idCheck = msg.channel.id
    for (let x = 0; x <= flurryChannels[0].length - 1; x++) {
      if (Date.now >= flurryChannels[1][x]) {
        Flurry.end(msg.channel)
      }
    }
    if (Date.now >= blizzardActive && blizzardActive > 0) {
      Flurry.blizzard.end()
    }
    //actually reactBecauseOfFlurry
    if (blizzardActive > 0) {
      return !(flurryBlacklist.includes(idCheck))
    } else {
      return (flurryChannels[0].includes(idCheck))
    }
    */
    return false;

  }
};

module.exports = Flurry;
//module.exports = flurryChannels;
//module.exports = flurryBlacklist;