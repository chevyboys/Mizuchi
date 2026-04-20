

class Queue {
  _items = [];
  constructor() { }

  push(...items) {
    items.forEach(item => {
      this._items.push(item);
    })
  }

  pop() {
    return this._items.shift();
  }

  peek() {
    return this._items[0];
  }

  isEmpty() {
    return this.length == 0;
  }

  get length() {
    return this._items.length;
  }

  get items() {
    return this._items;
  }
}

class PriorityQueue extends Queue {
  #comparator

  #parent(i) { return ((i + 1) >>> 1) - 1; }
  #left(i) { return (i << 1) + 1; }
  #right(i) { return (i + 1) << 1; }

  constructor(comparator = (lhs, rhs) => { return lhs > rhs; }) {
    super();
    this.#comparator = comparator;
  }

  push(...items) {
    items.forEach(item => {
      this._items.push(item);
      this.#siftUp();
    })
  }

  pop() {
    const res = this.peek();
    const bottom = this.length - 1;

    if (bottom > 0) {
      this.#swap(0, bottom);
    }
    this._items.pop();
    this.#siftDown();
    return res;
  }

  #compare(i, j) {
    return this.#comparator(this._items[i], this._items[j]);
  }

  #swap(i, j) {
    [this._items[i], this._items[j]] = [this._items[j], this._items[i]];
  }

  #siftUp() {
    let node = this.length - 1;
    while (node > 0 && this.#compare(node, this.#parent(node))) {
      this.#swap(node, this.#parent(node));
      node = this.#parent(node);
    }
  }

  #siftDown() {
    let node = 0;
    while (
      (this.#left(node) < this.length && this.#compare(this.#left(node), node)) ||
      (this.#right(node) < this.length && this.#compare(this.#right(node), node))
    ) {
      let maxChild = (this.#right(node) < this.length && this.#compare(this.#right(node), this.#left(node))) ? this.#right(node) : this.#left(node);
      this.#swap(node, maxChild);
      node = maxChild;
    }
  }

}

module.exports = {
  Queue,
  PriorityQueue
}