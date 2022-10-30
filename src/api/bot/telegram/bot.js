const TelegramBot = require('node-telegram-bot-api');
const callbackQueryProcessor = require('./callbackQueryProcessor');
const messageProcessor = require('./messageProcessor');
const commandProcessor = require('./commandProcessor');

const bot = new TelegramBot(process.env.TOKEN);

bot.on('polling_error', (e) => console.log('polling_error', e));

bot.setWebHook(process.env.WEBAPP_URL);

bot.on('callback_query', (callback) => {
  callbackQueryProcessor.process(callback, bot);
});

bot.on('message', (message) => {
  messageProcessor.process(message, bot);
});

commandProcessor.process(bot);
commandProcessor.setCommandMenu(bot);

module.exports = bot;
