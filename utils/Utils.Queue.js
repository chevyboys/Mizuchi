

class Queue {
  #items = [];
  #head = 0;
  #tail = 0;

  //Todo: modify this to accept an optional array or single item.
  constructor() { console.log('called'); }

  enqueue(item) {
    this.#items.push(item);
    this.#head++;
    console.log(this.#items);
  }

  dequeue() {
    const item = this.#items[this.#head];
    delete this.#items[this.#head];
    this.#head++;
    return item;
  }

  peek() {
    return this.#items[this.#head];
  }

  get length() {
    return this.#tail - this.#head;
  }

  get items() {
    return this.#items;
  }
}

class PriorityQueue extends Queue {
  #items = [];
  #head = 0;
  #comparator

  #parent(i) { return ((i + 1) >>> 1) - 1; }
  #left(i) { return (i << 1) + 1; }
  #right(i) { return (i + 1) << 1; }

  constructor(comparator = (lhs, rhs) => { return lhs > rhs; }) {

    super();
    this.#comparator = comparator;
  }

  enqueue() {

  }

  #compare(i, j) {
    return this.#comparator(this.#items[i], this.#items[j]);
  }

  #swap(i, j) {
    [this.#items[i], this.#items[j]] = [this.#items[j], this.#items[i]];
  }
  #siftUp() {
    let node = this.length() - 1;
    while (node > this.#head && this.#compare(node, this.#parent(node))) {
      this.#swap(node, this.parent(node));
      node = this.parent(node);
    }
  }

  #siftDown() {
    let node = this.#head;
    while (
      (this.#left(node) < this.size() && this._greater(this.#left(node), node)) ||
      (this.#right(node) < this.size() && this._greater(this.#right(node), node))
    ) {
      let maxChild = (this.#right(node) < this.size() && this._greater(this.#right(node), this.#left(node))) ? this.#right(node) : this.#left(node);
      this.#swap(node, maxChild);
      node = maxChild;
    }
  }

}

module.exports = {
  Queue,
  PriorityQueue
}