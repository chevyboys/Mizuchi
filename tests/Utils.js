const test = require('ava');
const { Queue, PriorityQueue } = require('../utils/Utils.Data.js'),
  { DateEmitter } = require('../utils/Utils.DateEvent.js');
const cats = require('./data/cats.json').cats;



test('Queue', t => {
  const queue = new Queue();
  queue.push(cats[0]);

  t.is('Jin', queue.peek());

});

test('Priority Queue', t => {
  const numbers = [];
  for (let i = 0; i < 100; i++) {
    numbers.push(Math.random());
  }
  const pqueue = new PriorityQueue();
  numbers.forEach(number => {
    pqueue.push(number);
  })
  let result = [];

  while (!pqueue.isEmpty()) {
    result.push(pqueue.pop());
  }

  pqueue.pop();

  t.deepEqual([...numbers].sort((a, b) => b - a), result);

});



test('DateEvent', t => {
  const startDate = Date.now();
  const event = new DateEmitter(startDate + 1000, "myDate");
  let afterDate;
  let testSwitch = false;
  function testDate() {
    t.is(true, testSwitch);
  }
  setTimeout(testDate(), 1000);
  event.on('myDate', () => {
    testSwitch = true;
    // afterDate = 
  })
});
