const EventEmitter = require('events');

class DateEmitter extends EventEmitter {
  static _dateEvents
  constructor(date, event) {
    super()
    this._dateEvents.push({ date, event });
  }



}

module.exports = DateEmitter;