var forever = require('forever-monitor');

var child = new (forever.Monitor)('bot.js', {
  args: []
});

child.on('exit', function () {
  console.log('bot has exited');
});

child.start();