const test = require('ava');
const rewire = require('rewire');
const jin = require('./data/members.json');

//this stuff is a possible reafactor into something that automatically  from  a list of strings.
// def extremely verbose to type for every module.
const botmeta = rewire('../modules/Module.CommandInteraction.BotMeta.js');
const sendDiscordStatus = botmeta.__get__('sendDiscordStatus');

test('Bot Meta Module', t => {

});

test('Cake Day Module', t => {
  //currently untestable 
});

const faq = rewire('../modules/Module.CommandInteraction.FAQ.js');
const dynamicallyCreateButtons = faq.__get__('dynamicallyCreateButtons');
test('FAQ Module', t => {

});

const qq = rewire('../modules/Module.CommandInteraction.QuestionQueue.js');
const questionRowButtons = qq.__get__('questionRowButtons'),
  checkForDuplicates = qq.__get__('checkForDuplicates'),
  transferAnswerComponents = qq.__get__('transferAnswerComponents'),
  processQQAButtonModalMaker = qq.__get__('processQQAButtonModalMaker'),
  processStats = qq.__get__('processStats');
test('Question Queue Module', t => {

});

const roll = rewire('../modules/Module.CommandInteraction.Roll.js');
const trimField = roll.__get__('trimField'),
  diceEmbed = roll.__get__('diceEmbed'),
  exampleFormater = roll.__get__('exampleFormater');
test('Roll Module', t => {

});

//todo serverinfo?
//todo thank?

const bookmark = rewire('../modules/Module.ContexMenu.Bookmark.js');
const memberHasSensativeData = bookmark.__get__('memberHasSensativeData'),
  sendBookmark = bookmark.__get__('sendBookmark');
test('FAQ Module', t => {

});

const welcome = rewire('../modules/Module.Infrastructure.Welcome.js');
const welcomeEscapeSequencesParse = welcome.__get__('welcomeEscapeSequencesParse'),
  welcomeStringCommandOverride = welcome.__get__('welcomeStringCommandOverride'),
  generateWelcomeObject = welcome.__get__('generateWelcomeObject');
test('Welcome Module', t => {
  t.is("", welcomeEscapeSequencesParse("[intentionally blank]", jin));
});

