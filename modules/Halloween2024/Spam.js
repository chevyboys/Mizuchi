const { Message } = require("discord.js");

class userMessage {
  constructor(uID, content, timestamp) {
    this.uID = uID;
    this.content = content;
    this.timestamp = timestamp;
  }
}

const record = [];

/*
  Check if the message is a duplicate of the last message a user sent
*/
function isDuplicateMessage(msg, message) {
  // eventually add something better for detection than exact match
  try {

    if (message.content === msg.content) {
      return true;
    }
  } catch {

  }

  return false;
}

/*
  Check the time since a user sent their last message
*/
function timeFromMessage(msg, message) {
  //
  try {
    difference = Math.abs(message.timestamp - msg.timestamp);
    return difference / 1000;
  } catch {
    //
  }

  return 1000000 / 1000;
}

// Function to find the userMessage by ID
/**function getLastUserMessage(uID) {
  return record.find(message => message.uID === uID) || null;
} */
function getLastUserMessage(uID) {
  //Logger.log("getting user message");
  let r = record.find(message => message.uID === uID);
  if (r != null) {
    //Logger.log("Message: " + r);
    return r;
  }
  //Logger.log("Message: not found ")
  return null;
}

/*
  Remove the last message by a user
*/
function removeLastUserMessage(uID) {

  if (record.length >= 1) {
    // Find the index of the last message with the given uID
    const index = record.findIndex(message => message.uID === uID);
    Logger.log(index);
    // If a message with the given uID is found, remove it
    if (index !== -1) {
      record.splice(index, 1);
    }

    return index;
  }
  return -2;
}

/*
  record the last message by a user
*/
/**
function recordLastMessage(uID, content, timestamp) {
  //
  removeLastUserMessage(uID);
  return record.push(new userMessage(uID, content, timestamp));
} */
function recordLastMessage(uID, content, timestamp) {
  Logger.log("record length: " + record.length);
  if (record.length != 0) {
    removeLastUserMessage(uID);
  }

  let b = record.push(new userMessage(uID, content, timestamp));
  //Logger.log("record length: " + record.length + "b: " + b);
  //Logger.log(record[0]);
  return b;
}



module.exports = {
  /**
   * 
   * @param {Message} msg 
   * @param {ParticipantManager} participants 
   * @returns {boolean} returns true if the message is spam
   */
  isSpam: async (dmsg, participants) => {
    //TODO: Implement this function @jhat0353

    // convert Message to userMessage
    let msg = new userMessage(uID = dmsg.member, content = dmsg.content, timestamp = dmsg.timestamp);

    // continue operations

    if (isAdmin(msg.uID)) {
      return false;
    }

    let text = msg.content.trim();
    if (text.length <= 10) {
      return true; //
    }

    let words = text.split(/\s/);
    //Logger.log("Word length: " + words.length)
    if (words.length <= 2) {
      return true;
    }

    let message = getLastUserMessage(uID);

    // check for time limits
    if (timeFromMessage(msg, message) <= 2) { // currently 2 seconds
      return true;
    }

    // check for duplicates
    if (isDuplicateMessage(msg, message)) {
      return true;
    }

    // record message timestamp and content
    recordLastMessage(msg.uID, text, msg.timestamp);

    return false; // passed all checks

  }
}