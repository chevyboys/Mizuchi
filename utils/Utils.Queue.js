
class Queue {
  #items = [];
  #headIndex = 0;
  #tailIndex = 0;

  //Todo: modify this to accept an optional array or single item.
  constructor() { }

  enqueue(item) {
    this.#items[this.#tailIndex] = item;
    this.#tailIndex++;
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

module.export = Queue;