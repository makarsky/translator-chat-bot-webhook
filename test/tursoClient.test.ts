const test = require('node:test');
const assert = require('node:assert/strict');
const { createChatSettingsStore } = require('../src/api/tursoClient');

test('missing chat settings return an empty object', async () => {
  const database = {
    async execute() {
      return { rows: [] };
    },
  };
  const store = createChatSettingsStore(database);

  assert.deepEqual(await store.getChatSettingsById(123), {});
});

test('chat settings are selected by string chat id and decoded from JSON', async () => {
  let statement;
  const database = {
    async execute(query) {
      statement = query;
      return { rows: [{ settings: '{"lastUsedLanguageCodes":["fr"]}' }] };
    },
  };
  const store = createChatSettingsStore(database);

  assert.deepEqual(await store.getChatSettingsById(123), {
    lastUsedLanguageCodes: ['fr'],
  });
  assert.deepEqual(statement.args, ['123']);
  assert.match(statement.sql, /WHERE chat_id = \?/);
});

test('settings are upserted as JSON with parameterized values', async () => {
  let statement;
  const database = {
    async execute(query) {
      statement = query;
    },
  };
  const store = createChatSettingsStore(database);
  const settings = { lastUsedLanguageCodes: ['de'] };

  await store.setChatSettingsById(456, settings);

  assert.deepEqual(statement.args, ['456', JSON.stringify(settings)]);
  assert.match(statement.sql, /ON CONFLICT\(chat_id\) DO UPDATE/);
});
