import { test } from 'node:test';
import assert from 'node:assert/strict';
import dispatchUpdate from '../src/api/bot/telegram/updateDispatcher.js';
import type { TelegramBotClient } from '../src/api/bot/telegram/types.js';

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
  const update = {
    update_id: 1,
    message: {
      chat: { id: 1 },
      from: { id: 1 },
      message_id: 1,
      text: 'hello',
    },
  };
  const bot = {} as TelegramBotClient;

  await dispatchUpdate(update, bot, processors);

  assert.deepEqual(calls, [
    ['command', bot, update.message],
    ['message', update.message, bot],
  ]);
});

test('handled commands do not continue into translation processing', async () => {
  const calls = [];

  await dispatchUpdate(
    {
      update_id: 2,
      message: {
        chat: { id: 1 },
        from: { id: 1 },
        message_id: 1,
        text: '/about',
      },
    },
    {} as TelegramBotClient,
    createProcessors(calls, true),
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'command');
});

test('callback dispatch awaits callback processing', async () => {
  const calls = [];
  const processors = createProcessors(calls);
  const callback = { data: 'callback' };
  const bot = {} as TelegramBotClient;

  await dispatchUpdate(
    { update_id: 3, callback_query: callback },
    bot,
    processors,
  );

  assert.deepEqual(calls, [['callback', callback, bot]]);
});

test('processor rejections propagate to the webhook caller', async () => {
  const processors = createProcessors([]);
  processors.messageProcessor.process = async () => {
    throw new Error('processing failed');
  };

  await assert.rejects(
    dispatchUpdate(
      {
        update_id: 4,
        message: {
          chat: { id: 1 },
          from: { id: 1 },
          message_id: 1,
        },
      },
      {} as TelegramBotClient,
      processors,
    ),
    /processing failed/,
  );
});
