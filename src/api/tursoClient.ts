const { createClient } = require('@libsql/client');

interface ChatSettings extends Record<string, unknown> {
  lastUsedLanguageCodes?: string[];
  source?: string;
  updatedAtTimestamp?: number;
}

interface Database {
  execute(statement: string | { sql: string; args?: unknown[] }): Promise<{
    rows: Array<{ settings?: unknown }>;
  }>;
}

const createChatSettingsStore = (database: Database) => ({
  async getChatSettingsById(chatId: number | string): Promise<ChatSettings> {
    const result = await database.execute({
      sql: 'SELECT settings FROM chat_settings WHERE chat_id = ?',
      args: [String(chatId)],
    });
    const settings = result.rows[0] && result.rows[0].settings;

    return settings ? (JSON.parse(String(settings)) as ChatSettings) : {};
  },

  async setChatSettingsById(chatId: number | string, settings: ChatSettings) {
    await database.execute({
      sql: `INSERT INTO chat_settings (chat_id, settings)
        VALUES (?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET settings = excluded.settings`,
      args: [String(chatId), JSON.stringify(settings)],
    });
  },
});

let client: ReturnType<typeof createClient> | undefined;

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
  execute: (statement: string | { sql: string; args?: unknown[] }) =>
    getClient().execute(statement),
});

module.exports = { ...store, createChatSettingsStore };
