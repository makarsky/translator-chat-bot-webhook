import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../index.js';
import telegramBot from '../src/api/bot/telegram/bot.js';

process.env.TELEGRAM_WEBHOOK_SECRET = 'test_secret';

const originalProcessUpdate = telegramBot.processUpdate;
let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test.afterEach(() => {
  telegramBot.processUpdate = originalProcessUpdate;
});

const postUpdate = (body, secret = 'test_secret') =>
  fetch(`${baseUrl}/api/v1/webhook`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-telegram-bot-api-secret-token': secret,
    },
    body: JSON.stringify(body),
  });

test('serves the frontend, verification file, and API health route', async () => {
  const [home, verification, health] = await Promise.all([
    fetch(baseUrl),
    fetch(`${baseUrl}/google7ef08398935a0a68.html`),
    fetch(`${baseUrl}/api/v1/`),
  ]);

  assert.equal(home.status, 200);
  assert.match(await home.text(), /Translator Chat Bot/);
  assert.equal(verification.status, 200);
  assert.match(await verification.text(), /google-site-verification/);
  assert.deepEqual(await health.json(), { message: 'API - 👋🌎🌍🌏' });
});

test('webhook rejects requests with an incorrect secret', async () => {
  const response = await postUpdate({ update_id: 1 }, 'wrong_secret');

  assert.equal(response.status, 401);
});

test('webhook rejects malformed Telegram updates', async () => {
  const response = await postUpdate({ message: {} });

  assert.equal(response.status, 400);
});

test('webhook waits for update processing before acknowledging', async () => {
  let markStarted;
  let finishProcessing;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const processing = new Promise((resolve) => {
    finishProcessing = resolve;
  });

  telegramBot.processUpdate = async (update) => {
    markStarted(update);
    await processing;
  };

  const responsePromise = postUpdate({ update_id: 3 }).then((response) => {
    return response;
  });
  await started;

  let completed = false;
  responsePromise.then(() => {
    completed = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(completed, false);

  finishProcessing();
  const response = await responsePromise;
  assert.equal(response.status, 200);
});

test('webhook returns a failure when update processing rejects', async () => {
  telegramBot.processUpdate = async () => {
    throw new Error('Telegram update failed');
  };

  const originalConsoleError = console.error;
  console.error = () => {};
  let response;
  try {
    response = await postUpdate({ update_id: 4 });
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(response.status, 500);
});
