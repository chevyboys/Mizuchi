const EventEmitter = require('events');
const Queue = require('Utils.Queue.js')

class DateEmitter extends EventEmitter {
  static #_dateEvents;
  static #_eventQueue = new Queue();
  constructor(date, event) {
    super()
    this._dateEvents.push({ date, event });
    this.queueEvents();
  }

  queueEvents() {
    for (let event in this._dateEvents) {
      if (Date.now() - event.date <= 1000 * 60 * 60 * 24) {
        this._eventQueue.enqueue(event);

        //TODO write perisitent cache

      }
    }
  }


}

module.exports = DateEmitter;