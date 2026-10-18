const { createClient } = require('@libsql/client');

const createChatSettingsStore = (database) => ({
  async getChatSettingsById(chatId) {
    const result = await database.execute({
      sql: 'SELECT settings FROM chat_settings WHERE chat_id = ?',
      args: [String(chatId)],
    });
    const settings = result.rows[0] && result.rows[0].settings;

    return settings ? JSON.parse(String(settings)) : {};
  },

  async setChatSettingsById(chatId, settings) {
    await database.execute({
      sql: `INSERT INTO chat_settings (chat_id, settings)
        VALUES (?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET settings = excluded.settings`,
      args: [String(chatId), JSON.stringify(settings)],
    });
  },
});

let client;

const getClient = () => {
  if (!client) {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error('Turso database environment variables are required');
    }

    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  return client;
};

const store = createChatSettingsStore({
  execute: (statement) => getClient().execute(statement),
});

module.exports = { ...store, createChatSettingsStore };
