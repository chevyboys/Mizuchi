const { EventEmitter, captureRejectionSymbol } = require('events');
const { PriorityQueue } = require('./Utils.Data.js')

class EventPacket {
  #event
  #date
  #once
  #callback
  constructor(date, event, callback, once) {
    this.#event = event;
    this.#date = date;
    this.#callback = callback;
    this.#once = once;
  }

  get event() {
    return this.#event;
  }

  get date() {
    return this.#date;
  }

  get callback() {
    return this.#callback;
  }

  get once() {
    return this.#once;
  }
}

class DateEmitter extends EventEmitter {
  static #timeoutID;
  static #timePeriod;
  static #eventQueue = new PriorityQueue((lhs, rhs) => { return lhs.date < rhs.date; });

  // 2073600000 is 24 days which is right below the 32 bit int length which is the maxium timeout delay
  constructor(date = undefined, event = undefined, callback = undefined, once = false, timePeriod = 2073600000) {
    super({ captureRejections: true });
    DateEmitter.#timePeriod = timePeriod
    if (date != undefined && event != undefined) {
      let packet = new EventPacket(date, event, callback, once);
      DateEmitter.#eventQueue.push(packet);
      if (packet == DateEmitter.#eventQueue.peek()) {
        this.queueEvent(true);
      } else {
        this.queueEvent();
      }
    } else if (date || event == undefined) {
      // throw soft error/warning 
    }
  }

  push(date, event, callback, once = false) {
    let packet = new EventPacket(date, event, callback, once);
    console.log(packet.date);
    DateEmitter.#eventQueue.push(packet);
    if (packet == DateEmitter.#eventQueue.peek()) {
      this.queueEvent(true);
    } else {
      this.queueEvent();
    }
  }


  async queueEvent(update = false) {

    const event = DateEmitter.#eventQueue.peek();
    console.log(event.date);
    if (DateEmitter.#timeoutID == undefined) {

      if (this.#isTimePeriod(event.date)) {
        DateEmitter.#timeoutID = setTimeout(() => { this.#emitEvent() }, event.date - Date.now());
      } else {
        const date = Date.now();
        const delay = Date.prototype.getUTCHours(date) * 60 * 60 * 1000 + Date.prototype.getUTCMinutes(date) * 60 * 1000 + Date.prototype.getUTCSeconds(date) * 1000 + Date.prototype.getUTCMilliseconds(date);
        DateEmitter.#timeoutID = setTimeout(() => { this.queueEvent() }, delay)
      }
    } else {
      if (update && this.#isTimePeriod(event.date)) {
        clearTimeout(DateEmitter.#timeoutID);
        DateEmitter.#timeoutID = setTimeout(() => { this.#emitEvent() }, event.date - Date.now());
      }
    }
  }

  static get events() {
    return DateEmitter.#eventQueue.items;
  }

  [captureRejectionSymbol](err, event, ...args) {
    console.log('rejection happened for', event, 'with', err, ...args);
  }

  #isTimePeriod(date) {
    return Date.now() - date <= DateEmitter.#timePeriod;
  }

  async #emitEvent() {
    const event = DateEmitter.#eventQueue.pop();

    this.emit(event.event, event.callback);
    DateEmitter.#timeoutID = undefined;
    if (!DateEmitter.#eventQueue.isEmpty()) {
      this.queueEvent();
    }
  }
}

/* todo:

- some sort of front end to handle the DateEmitter stuff automatically 
- handles repeating dates or events that only happen a certain amount of times


*/

// class Scheduler {
//   static #emitter = new DateEmitter();
//   static #jobs = [];
//   constructor() { }
//   static push(date, event, callback, amount = 1) {

//     return this.#emitter.on(event);
//   }

// }

// Scheduler._emitter.on("scheduler", (callback) => {

// })


module.exports = { DateEmitter };