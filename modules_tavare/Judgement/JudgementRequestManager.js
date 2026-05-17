const fs = require("fs");

const SPIRES = ["Hydra", "Phoenix", "Serpent", "Tiger", "Tortoise"].map(f => f.toLowerCase());
class JudgementRequestStatus {
  static hold = "hold";
  static queued = "queued";
}
exports.JudgementRequestStatus = JudgementRequestStatus;
/**
 * A class to represent a Judgement Request
 * @class
 */
class JudgementRequest {
  requester;
  desiredSpire = SPIRES[Math.floor(Math.random() * SPIRES.length)];
  status = JudgementRequestStatus.queued;
  /**
   * @constructor
   * @param {string} requester - The user who requested the judgement
   * @param {string} desiredSpire - The spire the requester wants visit.
   * @param {string} status - The status of the request
   */
  constructor(requester, spire, status = JudgementRequestStatus.queued) {
    if ((SPIRES.indexOf(spire.toLowerCase().trim()) > -1) || spire.toLowerCase() == "random") {
      if (status != JudgementRequestStatus.hold && status != JudgementRequestStatus.queued) {
        throw new Error("Invalid Status");
      } else {
        this.status = status;
        this.requester = requester;
        this.desiredSpire = spire || this.desiredSpire;
      }
    } else {
      throw new Error("Invalid Spire");
    }
  }
  /**
   * @returns {string} - A string representation of the Judgement Request
   */
  toString() {
    return `Requester: ${this.requester}, Desired Spire: ${this.desiredSpire}, Status: ${this.status}`;
  }

  /**
   * @param {Discord.Guild} guild - The guild to get the user string for
   * @returns {string} - A string representation of the username and requested spire of the Judgement Request
   */
  toUserString(guild) {
    //get the displayname from cache, or fetch if not available in the cache
    let displayName = guild.members.cache.get(this.requester)?.displayName || "<@" + this.requester + ">";
    return `${displayName} - ${this.desiredSpire}`;
  }
  /**
   *
   * @returns {Object} - A JSON representation of the Judgement Request
   */
  toJSON() {
    return {
      requester: this.requester,
      desiredSpire: this.desiredSpire,
      status: this.status
    };
  }
  update(requester, desiredSpire, status) {
    if (requester) {
      this.requester = requester;
    }
    if (desiredSpire) {
      this.desiredSpire = desiredSpire;
    }
    if (status) {
      this.status = status;
    }
  }
}
exports.JudgementRequest = JudgementRequest;
class JudgementRequestManager {
  requests = [];
  constructor() {
    let rawdata = fs.readFileSync("./data/judgement/requests.json");
    this.requests = JSON.parse(rawdata).map(req => new JudgementRequest(req.requester, req.desiredSpire));
  }
  /**
   *
   * @param {string|JudgementRequest} requester - The user who requested the judgement
   * @param {string} desiredSpire - The spire the requester wants visit.
   * @param {string} status - The status of the request
   * @returns {JudgementRequest} - The request that was added
   */
  add(requester, desiredSpire, status = JudgementRequestStatus.queued) {
    if (this.requests.find(req => req.requester == requester)) {
      throw new Error("Request already exists");
    } else if ((SPIRES.indexOf(desiredSpire.toLowerCase().trim()) == -1) && desiredSpire.toLowerCase() != "random") {
      throw new Error("Invalid Spire");
    }
    //if requester is a judgementRequest object, get the requester from the object
    const request = requester instanceof JudgementRequest ? requester : new JudgementRequest(requester, desiredSpire, status);
    this.requests.push(request);
    fs.writeFileSync("./data/judgement/requests.json", JSON.stringify(this.requests.map(req => req.toJSON())));
    return request;
  }
  /**
   *
   * @param {string|JudgementRequest} requester - The user who requested the judgement
   * @throws {Error} - If the request is not found
   */
  remove(requester) {
    let resolvedRequester = requester instanceof JudgementRequest ? requester.requester : requester;
    const index = this.requests.findIndex(req => req.requester == resolvedRequester);
    if (index > -1) {
      this.requests.splice(index, 1);
      fs.writeFileSync("./data/judgement/requests.json", JSON.stringify(this.requests.map(req => req.toJSON())));
    } else {
      throw new Error("Request not found");
    }
  }

  /**
   *
   * @param  {string|JudgementRequest} requester - The user who requested the judgement
   * @returns {JudgementRequest} - The request that was found
   * @throws {Error} - If the request is not found
   */
  get(requester) {
    let resolvedRequester = requester instanceof JudgementRequest ? requester.requester : requester;
    const request = this.requests.find(req => req.requester == resolvedRequester);
    if (request) {
      return request;
    } else {
      throw new Error("Request not found");
    }
  }

  /**
   *
   * @param {string|JudgementRequest} requester - The user who requested the judgement
   * @returns {boolean} - True if the request is found, false if it is not
   */
  has(requester) {
    let resolvedRequester = requester instanceof JudgementRequest ? requester.requester : requester;
    return this.requests.find(req => req.requester == resolvedRequester) ? true : false;
  }

  /**
   * sets the status of the request
   *
   * @param {string} requester - The user who requested the judgement
   * @param {string} status - The status of the request
   */
  setStatus(requester, status) {
    let resolvedRequester = requester instanceof JudgementRequest ? requester.requester : requester;
    const request = this.requests.find(req => req.requester == resolvedRequester);
    if (request) {
      request.status = status;
      fs.writeFileSync("./data/judgement/requests.json", JSON.stringify(this.requests.map(req => req.toJSON())));
    } else {
      throw new Error("Request not found");
    }
  }
  /**
   * sets the desired spire of the request
   *
   * @param {string} requester - The user who requested the judgement
   * @param {string} desiredSpire - The desired spire of the request
   */
  setSpire(requester, desiredSpire) {
    let resolvedRequester = requester instanceof JudgementRequest ? requester.requester : requester;
    const request = this.requests.find(req => req.requester == resolvedRequester);
    if (request) {
      request.desiredSpire = desiredSpire;
      fs.writeFileSync("./data/judgement/requests.json", JSON.stringify(this.requests.map(req => req.toJSON())));
    } else {
      throw new Error("Request not found");
    }
  }
}
exports.JudgementRequestManager = JudgementRequestManager;
