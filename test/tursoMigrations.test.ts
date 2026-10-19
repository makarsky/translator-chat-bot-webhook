const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { createClient } = require('@libsql/client');
const Umzug = require('umzug');
const {
  createTursoMigrationStorage,
} = require('../src/api/tursoMigrationStorage');

test('Umzug applies and reverts chat settings schema in Turso/libSQL', async () => {
  const database = createClient({ url: 'file::memory:' });
  const migrationsDirectory = path.resolve(process.cwd(), 'migrations');
  const storage = createTursoMigrationStorage(database, migrationsDirectory);

  try {
    await storage.ensureTable();

    const migrator = new Umzug({
      migrations: {
        path: migrationsDirectory,
        pattern: /^\d+[\w-]+\.js$/,
        params: [database],
      },
      storage,
      logging: false,
    });

    assert.deepEqual(
      (await migrator.pending()).map((migration) => migration.file),
      ['001_create_chat_settings.js'],
    );

    await migrator.up();
    const createdTable = await database.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'chat_settings'",
    );
    assert.equal(createdTable.rows.length, 1);
    assert.equal((await migrator.pending()).length, 0);

    await migrator.down();
    const droppedTable = await database.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'chat_settings'",
    );
    assert.equal(droppedTable.rows.length, 0);
    assert.equal((await migrator.pending()).length, 1);
  } finally {
    database.close();
  }
});
