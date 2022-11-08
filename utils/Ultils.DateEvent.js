const EventEmitter = require('events');
const PriorityQueue = require('Utils.Data.js')

// do not make async, breakage will happen without thread synchronization 
class DateEmitter extends EventEmitter {
  // static #nextJob;
  static #timeoutID
  static #eventQueue = new PriorityQueue((lhs, rhs) => { lhs.date < rhs.date });

  constructor(date, event) {
    super()

    this.#eventQueue.push({ date, event });
    if ({ date, event } == this.#eventQueue.peek()) {
      this.queueEvent(true);
    } else {
      this.queueEvent();
    }

  }

  queueEvent(update = false) {

    const event = this.#eventQueue.peek();
    if (this.#timeoutID == undefined) {

      if (this.#isToday(event.date)) {

        this.#timeoutID = setTimeout(this.#emitEvent(), Date.now() - event.date);
        //TODO schedule a job to pop

      } else {
        const date = Date.now();
        const delay = Date.prototype.getUTCHours(date) * 60 * 60 * 1000 + Date.prototype.getUTCMinutes(date) * 60 * 1000 + Date.prototype.getUTCSeconds(date) * 1000 + Date.prototype.getUTCMilliseconds(date);
        this.#timeoutID = setTimeout(this.queueEvent(), delay)
      }
    } else {
      if (update && this.#isToday(event.date)) {
        clearTimeout(this.#timeoutID);
        this.#timeoutID = setTimeout(this.#emitEvent(), Date.now() - event.date);
      }
    }

  }

  #isToday(date) {
    return Date.now() - date <= 1000 * 60 * 60 * 24;
  }

  #emitEvent() {
    let event = this.#eventQueue.pop().event;
    this.emit(event);
    this.#timeoutID = undefined;
    this.queueEvent();
  }

}


module.exports = DateEmitter;