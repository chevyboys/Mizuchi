const { Message } = require("discord.js");
const event = require('./utils');

class userMessage {
  constructor(member, content, timestamp) {
    this.member = member;
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
/**function getLastUserMessage(member) {
  return record.find(message => message.member === member) || null;
} */
function getLastUserMessage(member) {
  //Logger.log("getting user message");
  if (!member) {
    return null;
  }
  try {
    let r = record.find(message => message.member === member);
    if (r != null) {
      //Logger.log("Message: " + r);
      return r;
    }
  }
  catch (e) {
    return null;
  }

  return null;
}

/*
  Remove the last message by a user
*/
function removeLastUserMessage(member) {

  if (record.length >= 1) {
    // Find the index of the last message with the given member
    const index = record.findIndex(message => message.member === member);
    //Logger.log(index);
    // If a message with the given member is found, remove it
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
function recordLastMessage(member, content, timestamp) {
  //
  removeLastUserMessage(member);
  return record.push(new userMessage(member, content, timestamp));
} */
function recordLastMessage(member, content, timestamp) {
  //Logger.log("record length: " + record.length);
  if (record.length != 0) {
    removeLastUserMessage(member);
  }

  let b = record.push(new userMessage(member, content, timestamp));
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
  isSpam: async (msg, participants) => {
    //TODO: Implement this function @jhat0353


    if (event.isAdmin(msg.member)) {
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

    let message = getLastUserMessage(member);

    // check for time limits
    if (timeFromMessage(msg, message) <= 2) { // currently 2 seconds
      return true;
    }

    // check for duplicates
    if (isDuplicateMessage(msg, message)) {
      return true;
    }

    // record message timestamp and content
    recordLastMessage(msg.member, text, msg.timestamp);

    return false; // passed all checks

  }
}