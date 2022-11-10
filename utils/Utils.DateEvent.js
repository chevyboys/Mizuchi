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
  static #eventQueue = new PriorityQueue((lhs, rhs) => { lhs.date < rhs.date });

  constructor(date = undefined, event = undefined, callback = undefined, once = false) {
    super({ captureRejections: true });
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
        DateEmitter.#timeoutID = setTimeout(() => { this.#emitEvent() }, event.date - Date.now());
      } else {
        const date = Date.now();
        const delay = Date.prototype.getUTCHours(date) * 60 * 60 * 1000 + Date.prototype.getUTCMinutes(date) * 60 * 1000 + Date.prototype.getUTCSeconds(date) * 1000 + Date.prototype.getUTCMilliseconds(date);
        DateEmitter.#timeoutID = setTimeout(() => { this.queueEvent() }, delay)
      }
    } else {
      if (update && this.#isToday(event.date)) {
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

  #isToday(date) {
    return Date.now() - date <= 1000 * 60 * 60 * 24;
  }

  #emitEvent() {
    const event = DateEmitter.#eventQueue.pop();

    this.emit(event.event, event.callback);
    DateEmitter.#timeoutID = undefined;
    if (!DateEmitter.#eventQueue.isEmpty()) {
      this.queueEvent();
    }
  }
}


module.exports = { DateEmitter };