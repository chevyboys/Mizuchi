

const fs = require('fs');
const { Collection } = require("../../utils/Utils.Generic");
const questionFolder = "././data/question/";


function getAllQuestionFiles() {
  return fs.readdirSync(questionFolder).filter(x => x.endsWith(".json")).map(q => questionFolder + q);
}

/**
 * 
 * @param {Question} Question 
 */
function writeQuestionToFile(Question) {
  fs.writeFileSync(`${questionFolder}${Question.messageId}.json`, JSON.stringify(Question, 0, 2));
}

function validateQuestion(QuestionResolvable, objectToTestAgainst) {
  if (QuestionResolvable.status && !QuestionStatus[QuestionResolvable.status]) {
    throw new Error("invalid question status");
  } else if ((QuestionResolvable.messageId && QuestionResolvable.messageId == QuestionResolvable.askerId))
    throw new Error("askerid Cannot equal a messageid!")
  else if (QuestionResolvable.messageId && QuestionResolvable.messageId == objectToTestAgainst.askerId)
    throw new Error("messageId cannot equal my askerid!")
  else if (QuestionResolvable.askerId && QuestionResolvable.askerId == objectToTestAgainst.messageId)
    throw new Error("askerid cannot equal my messageid!")
  else if (QuestionResolvable.flags?.some(f => !QuestionFlag[f])) {
    throw new Error("flag " + QuestionResolvable.flags.find(f => !QuestionFlag[f]) + " is not a valid question flag")
  }
  else if (QuestionResolvable.askerId && (!(QuestionResolvable.askerId instanceof String) && !typeof QuestionResolvable.askerId === 'string'))
    throw new Error("Askerid must be a string")
}


class QuestionStatus {
  static Queued = "Queued";
  static Answered = "Answered";
  static Discarded = "Discarded";
}

class QuestionFlag {
  static unansweredButTransfered = "unansweredButTransfered";
  static RAFOed = "RAFOed";
}

class Question {
  /**
   * @param {QuestionResolvable} QuestionResolvable
   * @param {Discord.Snowflake} QuestionResolvable.messageId 
   * @param {QuestionStatus} QuestionResolvable.status 
   * @param {Discord.Snowflake} QuestionResolvable.askerId 
   * @param {String} QuestionResolvable.questionText 
   * @param {Discord.Snowflake[]} QuestionResolvable.voterIds 
   * @param {Discord.Snowflake} QuestionResolvable.requestedAnswerers 
   * @param {QuestionFlag[]} QuestionResolvable.answerText 
   */
  constructor(QuestionResolvable, write) {
    if (!QuestionResolvable.messageId) {
      throw new Error("messageId required but not provided");
    }
    else this.messageId = QuestionResolvable.messageId;

    if (!QuestionResolvable.status) {
      throw new Error("status required but not provided");
    }
    else this.status = QuestionResolvable.status;


    if (!QuestionResolvable.askerId) {
      throw new Error("askerId required but not provided");
    }
    else this.askerId = QuestionResolvable.askerId;

    if (!QuestionResolvable.questionText) {
      throw new Error("questionText required but not provided");
    }
    else this.questionText = QuestionResolvable.questionText;

    if (!QuestionResolvable.voterIds) {
      QuestionResolvable.voterIds = [];
    }
    else this.voterIds = QuestionResolvable.voterIds;

    if (!QuestionResolvable.requestedAnswerers) {
      throw new Error("requestedAnswerers required but not provided");
    }
    else this.requestedAnswerers = QuestionResolvable.requestedAnswerers;

    if (!QuestionResolvable.flags) {
      QuestionResolvable.flags = [];
    }
    else this.flags = QuestionResolvable.flags;

    if (!QuestionResolvable.timestamp) {
      throw new Error('timestamp missing from question')
    } else this.timestamp = QuestionResolvable.timestamp;

    this.answerText = QuestionResolvable.answerText
    validateQuestion(QuestionResolvable, this);
    if (write) {
      writeQuestionToFile(this);
    }


  }
  /**
   * Deletes the underlying file this question uses. 
   * DO NOT USE unless you understand the consequences
   * @param {String} messageId 
   */
  delete(messageId) {
    let targetId = messageId || this.messageId;
    fs.unlinkSync(`${questionFolder}${targetId}.json`);
  }
  /**
   * @param {QuestionResolvable} QuestionResolvable
   * @param {Discord.Snowflake} QuestionResolvable.messageId 
   * @param {QuestionStatus} QuestionResolvable.status 
   * @param {Discord.Snowflake} QuestionResolvable.askerId 
   * @param {String} QuestionResolvable.questionText 
   * @param {Discord.Snowflake[]} QuestionResolvable.voterIds 
   * @param {Discord.Snowflake} QuestionResolvable.requestedAnswerers 
   * @param {QuestionFlag[]} QuestionResolvable.flags
   * @param {String} QuestionResolvable.answerText 
   */
  update(QuestionResolvable) {
    validateQuestion(QuestionResolvable, this)
    this.status = QuestionResolvable.status || this.status;
    this.askerId = QuestionResolvable.askerId || this.askerId;
    this.questionText = QuestionResolvable.questionText || this.questionText;
    this.voterIds = QuestionResolvable.voterIds || this.voterIds;
    this.requestedAnswerers = QuestionResolvable.requestedAnswerers || this.requestedAnswerers;
    this.flags = QuestionResolvable.flags || this.flags;
    this.timestamp = QuestionResolvable.timestamp || this.timestamp;
    this.answerText = QuestionResolvable.answerText || this.answerText;
    if (QuestionResolvable.messageId && this.messageId != QuestionResolvable.messageId) {
      const oldMessageId = this.messageId;
      this.messageId = QuestionResolvable.messageId;
      writeQuestionToFile(this);
      this.delete(oldMessageId);
    } else {
      writeQuestionToFile(this);
    }
    return this;
  }

}


class QuestionManager {
  constructor() {
  }
  /**
   * 
   * @returns {Collection} a read only collection that allows for easy sorting and checking of questions.
   */
  readOnlyCollection() {
    let collection = new Collection;
    for (const file of getAllQuestionFiles()) {
      const parsedFile = new Question(JSON.parse(fs.readFileSync(`${file}`)));
      collection.set(parsedFile.messageId, parsedFile);
    }
    return collection;
  }

  Question = Question;
  Status = QuestionStatus;
  Flags = QuestionFlag;

}


module.exports = QuestionManager