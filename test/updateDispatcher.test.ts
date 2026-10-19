const test = require('node:test');
const assert = require('node:assert/strict');
const dispatchUpdate = require('../src/api/bot/telegram/updateDispatcher');

const createProcessors = (calls, commandResult = false) => ({
  commandProcessor: {
    async process(bot, message) {
      calls.push(['command', bot, message]);
      return commandResult;
    },
  },
  messageProcessor: {
    async process(message, bot) {
      calls.push(['message', message, bot]);
    },
  },
  callbackQueryProcessor: {
    async process(callback, bot) {
      calls.push(['callback', callback, bot]);
    },
  },
});

test('message dispatch awaits command detection and message processing', async () => {
  const calls = [];
  const processors = createProcessors(calls);
  const update = { message: { text: 'hello' } };
  const bot = {};

  await dispatchUpdate(update, bot, processors);

  assert.deepEqual(calls, [
    ['command', bot, update.message],
    ['message', update.message, bot],
  ]);
});

test('handled commands do not continue into translation processing', async () => {
  const calls = [];

  await dispatchUpdate(
    { message: { text: '/about' } },
    {},
    createProcessors(calls, true),
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'command');
});

test('callback dispatch awaits callback processing', async () => {
  const calls = [];
  const processors = createProcessors(calls);
  const callback = { data: 'callback' };
  const bot = {};

  await dispatchUpdate({ callback_query: callback }, bot, processors);

  assert.deepEqual(calls, [['callback', callback, bot]]);
});

test('processor rejections propagate to the webhook caller', async () => {
  const processors = createProcessors([]);
  processors.messageProcessor.process = async () => {
    throw new Error('processing failed');
  };

  await assert.rejects(
    dispatchUpdate({ message: {} }, {}, processors),
    /processing failed/,
  );
});
