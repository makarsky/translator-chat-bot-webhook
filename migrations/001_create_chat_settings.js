const up = async (database) => {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS chat_settings (
      chat_id TEXT PRIMARY KEY,
      settings TEXT NOT NULL CHECK (json_valid(settings))
    )
  `);
};

const down = async (database) => {
  await database.execute('DROP TABLE IF EXISTS chat_settings');
};

export { up, down };
