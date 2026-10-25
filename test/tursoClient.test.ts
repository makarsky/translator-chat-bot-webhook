import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTursoClientConfig,
  createChatSettingsStore,
  createTursoClient,
} from '../src/api/tursoClient.js';

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

test('chat settings parse and upsert helpers stay pure and deterministic', async () => {
  const { parseChatSettings, buildChatSettingsUpsert } = await import(
    '../src/api/chatSettingsPolicy.js'
  );

  assert.deepEqual(parseChatSettings('{"lastUsedLanguageCodes":["fr"]}'), {
    lastUsedLanguageCodes: ['fr'],
  });
  assert.deepEqual(parseChatSettings(undefined), {});
  assert.deepEqual(buildChatSettingsUpsert(456, { lastUsedLanguageCodes: ['de'] }), {
    sql: `INSERT INTO chat_settings (chat_id, settings)
        VALUES (?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET settings = excluded.settings`,
    args: ['456', JSON.stringify({ lastUsedLanguageCodes: ['de'] })],
  });
});

test('Turso client config validates env and factory injection remains explicit', () => {
  assert.deepEqual(
    buildTursoClientConfig({
      TURSO_DATABASE_URL: 'db-url',
      TURSO_AUTH_TOKEN: 'token',
    }),
    {
      url: 'db-url',
      authToken: 'token',
    },
  );

  assert.throws(
    () => buildTursoClientConfig({ TURSO_DATABASE_URL: 'db-url' }),
    /Turso database environment variables are required/,
  );

  const created = createTursoClient(
    { TURSO_DATABASE_URL: 'db-url', TURSO_AUTH_TOKEN: 'token' },
    ({ url, authToken }) => ({ url, authToken }) as any,
  );

  assert.deepEqual(created, { url: 'db-url', authToken: 'token' });
});
