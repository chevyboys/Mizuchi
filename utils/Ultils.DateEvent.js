const EventEmitter = require('events');
const PriorityQueue = require('Utils.Data.js')

class DateEmitter extends EventEmitter {
  static #_dateEvents;
  static #_eventQueue = new PriorityQueue((lhs, rhs) => { lhs.date < rhs.date });
  constructor(date, event) {
    super()
    this._dateEvents.push({ date, event });
    this.queueEvents();
  }

  queueEvents() {
    for (let event in this._dateEvents) {
      if (Date.now() - event.date <= 1000 * 60 * 60 * 24) {
        this._eventQueue.enqueue(event);

        //TODO schedule a job to pop

      }
    }
  }


}

module.exports = DateEmitter;