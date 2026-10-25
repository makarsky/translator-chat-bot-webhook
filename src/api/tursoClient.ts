import { createClient } from '@libsql/client';
import {
  buildChatSettingsUpsert,
  parseChatSettings,
  type ChatSettings,
} from './chatSettingsPolicy.js';

interface Database {
  execute(statement: string | { sql: string; args?: string[] }): Promise<{
    rows?: Array<{ settings?: unknown }>;
  } | void>;
}

export const buildTursoClientConfig = (
  env: NodeJS.ProcessEnv = process.env,
): { url: string; authToken: string } => {
  const url = env.TURSO_DATABASE_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('Turso database environment variables are required');
  }

  return { url, authToken };
};

export const createTursoClient = (
  env: NodeJS.ProcessEnv = process.env,
  clientFactory: typeof createClient = createClient,
) => clientFactory(buildTursoClientConfig(env));

const createChatSettingsStore = (database: Database) => ({
  async getChatSettingsById(chatId: number | string): Promise<ChatSettings> {
    const result = await database.execute({
      sql: 'SELECT settings FROM chat_settings WHERE chat_id = ?',
      args: [String(chatId)],
    });
    const settings = result?.rows?.[0]?.settings;

    return parseChatSettings(settings);
  },

  async setChatSettingsById(chatId: number | string, settings: ChatSettings) {
    await database.execute(buildChatSettingsUpsert(chatId, settings));
  },
});

let client: ReturnType<typeof createClient> | undefined;

const getClient = () => {
  if (!client) {
    client = createTursoClient();
  }

  return client;
};

const store = createChatSettingsStore({
  execute: async (statement) => {
    const result =
      typeof statement === 'string'
        ? await getClient().execute(statement)
        : await getClient().execute(statement.sql, statement.args);
    return {
      rows: result.rows as unknown as Array<{ settings?: unknown }>,
    };
  },
});

export { createChatSettingsStore };
export default { ...store, createChatSettingsStore };
