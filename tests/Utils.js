const test = require('ava');
const { Queue } = require('../utils/Utils.Queue.js');

test('Queue', t => {
  const cats = new Queue();
  cats.enqueue('Jin');

  t.is('Jin', cats.peek());

});

test('Priority Queue', t => {

});

test('')