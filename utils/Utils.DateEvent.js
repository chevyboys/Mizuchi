const { EventEmitter, captureRejectionSymbol } = require('events');
const { PriorityQueue } = require('./Utils.Data.js')

class EventPacket {
  #event
  #date
  #once
  constructor(date, event, once) {
    this.#event = event;
    this.#date = date;
    this.#once = once;
  }

  get event() {
    return this.#event;
  }

  get date() {
    return this.#date;
  }

  get once() {
    return this.#once;
  }
}

// do not make async, breakage will happen without thread synchronization
class DateEmitter extends EventEmitter {
  // static #nextJob;
  static #timeoutID;
  static #eventQueue = new PriorityQueue((lhs, rhs) => { lhs.date < rhs.date });

  constructor(date, event, once = false) {
    super({ captureRejections: true });
    let packet = new EventPacket(date, event, once);
    DateEmitter.#eventQueue.push(packet);
    if (packet == DateEmitter.#eventQueue.peek()) {
      this.queueEvent(true);
    } else {
      this.queueEvent();
    }
  }

  queueEvent(update = false) {

    const event = DateEmitter.#eventQueue.peek();
    if (DateEmitter.#timeoutID == undefined) {

      if (this.#isToday(event.date)) {
        DateEmitter.#timeoutID = setTimeout(() => { this.#emitEvent() }, Date.now() - event.date);
      } else {
        const date = Date.now();
        const delay = Date.prototype.getUTCHours(date) * 60 * 60 * 1000 + Date.prototype.getUTCMinutes(date) * 60 * 1000 + Date.prototype.getUTCSeconds(date) * 1000 + Date.prototype.getUTCMilliseconds(date);
        DateEmitter.#timeoutID = setTimeout(() => { this.queueEvent() }, delay)
      }
    } else {
      if (update && this.#isToday(event.date)) {
        clearTimeout(DateEmitter.#timeoutID);
        DateEmitter.#timeoutID = setTimeout(() => { this.#emitEvent() }, Date.now() - event.date);
      }
    }
  }

  [captureRejectionSymbol](err, event, ...args) {
    console.log('rejection happened for', event, 'with', err, ...args);
  }

  #isToday(date) {
    return Date.now() - date <= 1000 * 60 * 60 * 24;
  }

  #emitEvent() {
    const event = DateEmitter.#eventQueue.pop().event;
    this.emit(event);
    DateEmitter.#timeoutID = undefined;
    if (!DateEmitter.#eventQueue.isEmpty()) {
      this.queueEvent();
    }
  }
}


module.exports = { DateEmitter };