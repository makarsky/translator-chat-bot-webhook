import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTelegramClient } from '../src/api/bot/telegram/telegramClientFactory.js';

test('createTelegramClient sends wrapped Telegram requests through the underlying API', async () => {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const api = {
    sendMessage: async (...args) => {
      calls.push({ method: 'sendMessage', args });
      return 'sent';
    },
    sendSticker: async (...args) => {
      calls.push({ method: 'sendSticker', args });
      return 'sticker';
    },
    editMessageText: async (...args) => {
      calls.push({ method: 'editMessageText', args });
      return 'edited';
    },
    sendAudio: async (...args) => {
      calls.push({ method: 'sendAudio', args });
      return 'audio';
    },
    setMyCommands: async (...args) => {
      calls.push({ method: 'setMyCommands', args });
      return 'commands';
    },
  };

  const client = createTelegramClient(api as never);

  await client.sendMessage(1, 'hello', { parse_mode: 'MarkdownV2' });
  await client.sendSticker(1, 'sticker-id');
  await client.editMessageText('updated', {
    chat_id: 1,
    message_id: 2,
    parse_mode: 'MarkdownV2',
  });
  await client.sendAudio(1, {} as never, { caption: 'caption' }, {
    filename: 'voice.mp3',
  });
  await client.setMyCommands([{ command: 'start', description: 'Start' }], {
    language_code: 'en',
  });

  assert.deepEqual(calls.map((call) => call.method), [
    'sendMessage',
    'sendSticker',
    'editMessageText',
    'sendAudio',
    'setMyCommands',
  ]);
  assert.equal(calls[0].args[0], 1);
  assert.equal(calls[2].args[2], 'updated');
  assert.equal((calls[3].args[2] as { caption?: string }).caption, 'caption');
  assert.ok(calls[3].args[1]);
});
