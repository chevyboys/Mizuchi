

class Queue {
  #items = [];
  #headIndex = 0;
  #tailIndex = 0;

  //Todo: modify this to accept an optional array or single item.
  constructor() { console.log('called'); }

  enqueue(item) {
    this.#items.push(item);
    this.#tailIndex++;
    console.log(this.#items);
  }

  dequeue() {
    const item = this.#items[this.#headIndex];
    delete this.#items[this.#headIndex];
    this.#headIndex++;
    return item;
  }

  peek() {
    return this.#items[this.#headIndex];
  }

  get length() {
    return this.#tailIndex - this.#headIndex;
  }

  get items() {
    return this.#items;
  }
}

class PriorityQueue extends Queue {

  constructor() { super(); }

  enqueue() {

  }




}

module.exports = {
  Queue,
  PriorityQueue
}