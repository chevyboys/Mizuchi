

const { JudgementRequestManager } = require("./JudgementRequestManager");
const config = require("../../config/config.json");
const AttunementUtils = require("../../Judgement/AttunementRolesUtils");
const { Collection } = require("../../utils/Utils.Generic");
const Attunement = require("../../Judgement/AttunementRolesUtils").Attunement;
const spires = AttunementUtils.spires();
const fs = require("fs");
const u = require("../../utils/Utils.Generic");

class attunementSnowflakes {

  static generate() {
    //get the unix timestamp as a number to seed the snowflake
    let snowflake = BigInt(Date.now());
    //shift the snowflake to the left by 22 bits
    snowflake = snowflake << BigInt(22);
    //add the worker id to the snowflake
    snowflake += BigInt(config.workerId || 0);
    return snowflake.toString();
  }
}

class Score {
  constructor({ r, y, bu, w, bk, unknownFate = false }) {
    //check r,y,bu,w,bk are all numbers
    if (unknownFate) {
      if (typeof dead != "boolean") {
        throw new Error("Invalid dead value");
      }

    } else if (typeof r != "number" || typeof y != "number" || typeof bu != "number" || typeof w != "number" || typeof bk != "number") {
      throw new Error("Invalid score");
    }
    this.r = r;
    this.y = y;
    this.bu = bu;
    this.w = w;
    this.bk = bk;
    this.unknownFate = unknownFate;
  }
}

class ScorePriorityCollectionElement {
  /**
   * 
   * @param {number} scorePriority
   * @param {Attunement} attunement
   * @description Represents a score priority for a specific attunement
   * @constructor
   */
  constructor(scorePriority, attunement) {
    this.scorePriority = scorePriority;
    this.attunement = attunement;
  }

  toJSON() {
    return {
      scorePriority: this.scorePriority,
      attunement: this.attunement.name
    }
  }
}

class AttunementResult {
  /**
   * 
   * @param {*} param0
   * @param {Score} param0.score
   * @param {string} param0.spire
   * @param {string} param0.location
   * @param {string} param0.attunement
   * @param {Array<ScorePriorityCollectionElement>} param0.attunementScorePriorities
   */
  constructor({ score, spire, location, attunement, scorePriorities }) {
    this.score = score;
    this.attunement = attunement;
    this.attunementScorePriorities = scorePriorities;
    this.location = location;
    this.spire = spire;
  }

  toString() {
    return `${this.spire} - ${this.attunement.name} - ${this.location}`;
  }

  toJSON() {
    return {
      score: this.score,
      attunement: this.attunement.name,
      location: this.location,
      scorePriorities: this.attunementScorePriorities.map(scPr => scPr.toJSON()).sort((a, b) => a.scorePriority - b.scorePriority),
      spire: this.spire
    }
  }
}

class AttunementRecord {
  /**
   * 
   * @param {*} param0 
   * @param {AttunementResult} param0.result
   * @param {Discord.User} param0.user
   * @param {string} param0.notes
   * @param {string} param0.code
   */
  constructor({ result, user, notes, code, id }) {
    if (!(result instanceof AttunementResult)) throw new Error("Invalid result");
    this.user = user.id ? user.id : user;
    this.result = result;
    this.notes = notes;
    this.code = code;
    //generate a discord snowflake for this record
    this.id = id || attunementSnowflakes.generate();
  }

  toJSON() {
    return {
      user: this.user,
      result: this.result.toJSON(),
      notes: this.notes,
      code: this.code,
      id: this.id
    }
  }
}

class AttunementRecordManager extends Collection {
  constructor(filepath) {
    super();
    this.filepath = filepath;
    //load the records from the file
    this.load();

  }

  set(id, record) {
    super.set(id, record);
    this.save();
  }

  clear() {
    super.clear();
    this.save();
  }

  delete(key) {
    super.delete(key);
    this.save();
  }

  ensure(key, defaultValueGenerator) {
    if (!super.has(key)) {
      this.set(key, defaultValueGenerator());
    }
    return super.get(key);
  }

  forEach(callback, thisArg) {
    super.forEach(callback, thisArg);
    this.save();
  }

  sweep(callback) {
    super.sweep(callback);
    this.save();
  }

  tap(callback) {
    super.tap(callback);
    this.save();
  }

  load() {
    for (const record of JSON.parse(fs.readFileSync(this.filepath))) {
      record.result.score = new Score(record.result.score);
      record.result.scorePriorities = record.result.scorePriorities.map(scPr => new ScorePriorityCollectionElement(scPr.scorePriority, AttunementUtils.attunements().find(att => att.name == scPr.attunement)));
      record.result = new AttunementResult(record.result);
      super.set(record.id, new AttunementRecord(record));
    }
  }

  reload() {
    super.clear();
    this.load();
  }

  save() {
    fs.writeFileSync(this.filepath, "[" + this.map(record => JSON.stringify(record.toJSON())).join(",\n") + "]");
  }
}


/**
 * Resolves a code into a score object
 * @param {string} code
 * @returns {Score}
 * @throws {Error}
 */

parseScore = (code) => {
  codeArr = code.split(",").map(c => c.trim());
  if (codeArr.length != 5 && code.indexOf("death") < 0) throw new Error("Invalid code (input is not rybuwbk)");
  let score = new Score({
    r: parseInt(codeArr[0]),
    y: parseInt(codeArr[1]),
    bu: parseInt(codeArr[2]),
    w: parseInt(codeArr[3]),
    bk: parseInt(codeArr[4]),
    unknownFate: code.indexOf("death") > -1 || code.indexOf("unknown") > -1 || code.indexOf("fail") > -1
  });
  return score;
}


/**
 * 
 * @param {string} code 
 * @param {string} spire
 */

getAttunementResult = (code, spire) => {
  let score = parseScore(code);
  //Determine if the attuned failed
  //if score.bk is the highest value of every score,
  let bkIsHighest = score.bk >= score.r && score.bk >= score.y && score.bk >= score.bu;

  if (score.unknownFate || score.bk > 10 || bkIsHighest) {
    return new AttunementResult({
      score: score,
      attunement: "Unknown",
      location: "Unknown",
      scorePriorities: [],
      spire: spire,
    })
  }

  //determine w score
  //10% chance to set w to 0
  if (Math.random() < 0.1) {
    score.w = 0;
  }
  //if w ties with another color, reduce it by 1 until it does not tie
  while (score.w == score.r || score.w == score.y || score.w == score.bu) {
    score.w--;
  }



  let spireToGetAttunementFrom = spire;
  //on a 2% chance, the spire will be random
  if (Math.random() < 0.02) {
    spireToGetAttunementFrom = spires[Math.floor(Math.random() * spires.length)];
  }


  //add random tiebreaker decimals to each score
  score.r += Math.random() * 0.1;
  score.y += Math.random() * 0.1;
  score.bu += Math.random() * 0.1;
  score.w += Math.random() * 0.1;

  let scoreArray = [score.r, score.y, score.bu, score.w].sort((a, b) => b - a);

  let highestScoreLetter = "";
  let secondHighestScoreLetter = "";
  let thirdHighestScoreLetter = "";
  let lowestScoreLetter = "";

  switch (scoreArray[0]) {
    case score.r: highestScoreLetter = "r"; break;
    case score.y: highestScoreLetter = "y"; break;
    case score.bu: highestScoreLetter = "b"; break;
    case score.w: highestScoreLetter = "w"; break;
  }

  switch (scoreArray[1]) {
    case score.r: secondHighestScoreLetter = "r"; break;
    case score.y: secondHighestScoreLetter = "y"; break;
    case score.bu: secondHighestScoreLetter = "b"; break;
    case score.w: secondHighestScoreLetter = "w"; break;
  }

  switch (scoreArray[2]) {
    case score.r: thirdHighestScoreLetter = "r"; break;
    case score.y: thirdHighestScoreLetter = "y"; break;
    case score.bu: thirdHighestScoreLetter = "b"; break;
    case score.w: thirdHighestScoreLetter = "w"; break;
  }

  switch (scoreArray[3]) {
    case score.r: lowestScoreLetter = "r"; break;
    case score.y: lowestScoreLetter = "y"; break;
    case score.bu: lowestScoreLetter = "b"; break;
    case score.w: lowestScoreLetter = "w"; break;
  }


  //get the score priority from the attunement score codes
  let attunementsByPriority = AttunementUtils.attunements().map(att => {
    //if att.scoreCode is an array, use whichever score is lowest
    let lowestScore;
    if (att.scoreCode instanceof Array) {
      lowestScore = att.scoreCode.map(sc => parseInt(
        sc.toLowerCase().replace(highestScoreLetter, "1")
          .replace(secondHighestScoreLetter, "2")
          .replace(thirdHighestScoreLetter, "3")
          .replace(lowestScoreLetter, "4")
      )).sort((a, b) => a - b)[0];

      console.log(lowestScore);
    } else {
      lowestScore = att.scoreCode;
    }
    let scorePriority = parseInt(lowestScore.toString().toLowerCase()
      .replace(highestScoreLetter, "1")
      .replace(secondHighestScoreLetter, "2")
      .replace(thirdHighestScoreLetter, "3")
      .replace(lowestScoreLetter, "4"))
    return new ScorePriorityCollectionElement(scorePriority, att);
  }).sort((a, b) => a.scorePriority - b.scorePriority);

  //on a 2 percent chance, get a random attunement from this spire
  if (Math.random() < 0.02) {
    let attunementPool = AttunementUtils.attunements().filter(att => att.tower == spireToGetAttunementFrom);
    return new AttunementResult({
      score: score,
      attunement: attunementPool[Math.floor(Math.random() * attunementPool.length)],
      location: ["Left Arm", "Right Arm", "Left Leg", "Right Leg", "Mind", "Heart", "Lung"][Math.floor(Math.random() * 7)],
      spire: spire,
      scorePriorities: attunementsByPriority
    });
  }

  //get the attunement with the lowest score priority
  return new AttunementResult({
    score: score,
    attunement: attunementsByPriority.filter(attBP => attBP.attunement.tower == spire)[0].attunement,
    //get random location from left arm, right arm, left leg, right leg, mind, heart, lung
    location: ["Left Arm", "Right Arm", "Left Leg", "Right Leg", "Mind", "Heart", "Lung"][Math.floor(Math.random() * 7)],
    spire: spire,
    scorePriorities: attunementsByPriority
  }
  );
}

/**
 * 
 * @param {Discord.interaction} interaction 
 * @param {JudgementRequestManager} requests 
 */
const handleScoreInteraction = (interaction, requests) => {
  const attunementRecords = new AttunementRecordManager("./data/judgement/records.json");
  if (interaction.member.id != config.ownerId) return interaction.reply({ content: "You do not have permission to use this command", ephemeral: true });
  //handle the judgement judge subcommand
  if (interaction.options.getSubcommand() == "judge") {
    let code = interaction.options.getString("code");
    let user = interaction.options.getUser("user");
    let spire = interaction.options.getString("spire");
    let notes = interaction.options.getString("notes");
    let result = getAttunementResult(code, spire);
    let record = new AttunementRecord({ result: result, user: user, notes: notes, code: code, });
    attunementRecords.set(record.id, record);
    return interaction.reply({
      content: `Judged ${user.username} for ${spire} with code ${code}`, embeds: [
        u.embed().setTitle("Judgement Result")
          .setDescription(`Attunement: ${result.attunement.name}\nLocation: ${result.location}\nSpire: ${result.spire}\nNotes: ${notes}`)
          .addFields(result.attunementScorePriorities.map(scPr => {
            return {
              name: scPr.attunement.name,
              value: scPr.scorePriority
            }
          }).slice(0, 10)
          )
      ], ephemeral: true
    });
  }
}


module.exports = handleScoreInteraction;
/* JSON for registering the command:
{
  "name": "judgement",
    "description": "Request a judgement from the Voices of the Tower",
      "options": [
        {
          "name": "request",
          "description": "Request a judgement",
          "type": 1,
          "options": [
            {
              "name": "spire",
              "description": "The spire you wish to visit",
              "type": 3,
              "required": true,
              "choices": [
                {
                  "name": "Hydra",
                  "value": "Hydra"
                },
                {
                  "name": "Phoenix",
                  "value": "Phoenix "
                },
                {
                  "name": "Serpent",
                  "value": "Serpent"
                },
                {
                  "name": "Tiger",
                  "value": "Tiger"
                },
                {
                  "name": "Tortoise",
                  "value": "Tortoise"
                },
                {
                  "name": "Random",
                  "value": "Random"
                }
              ]
            }
          ]
        },
        {
          "name": "view",
          "description": "View the current Judgement Requests",
          "type": 1
        },
        {
          "name": "select",
          "description": "Select candidates for judgement",
          "type": 1
        },
        {
          "name": "remove",
          "description": "Remove a user"s judgement request",
          "type": 1,
          "options": [
            {
              "name": "user",
              "description": "The user to remove",
              "type": 6,
              "required": true
            }
          ]
        },
        {
          "name": "judge",
          "description": "Enter a code to calculate a user"s attunement",
          "type": 1,
          "options": [
            {
              "name": "code",
              "description": "The comma seperated codes to use for judging",
              "type": 3,
              "required": true
            },
            {
              "name": "user",
              "description": "The user to judge",
              "type": 6,
              "required": true
            },
            {
              "name": "spire",
              "description": "The spire to judge for",
              "type": 3,
              "required": true,
              "choices": [
                {
                  "name": "Hydra",
                  "value": "Hydra"
                },
                {
                  "name": "Phoenix",
                  "value": "Phoenix "
                },
                {
                  "name": "Serpent",
                  "value": "Serpent"
                },
                {
                  "name": "Tiger",
                  "value": "Tiger"
                },
                {
                  "name": "Tortoise",
                  "value": "Tortoise"
                }
              ]
            },
            {
              "name": "notes",
              "description": "Any notes to add to the judgement",
              "type": 3
            }
          ]
        },
        {
          "name": "admin",
          "description": "Opens the admin console for the selected request",
          "type": 1
      "options": [
            {
              "name": "request",
              "description": "The request to view",
              "type": 6,
              "required": true,
              "autocomplete": true
            }
          ]
        }
      ]
}
*/