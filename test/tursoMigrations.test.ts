import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';
import Umzug from 'umzug';
import { createTursoMigrationStorage } from '../src/api/tursoMigrationStorage.js';

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
        customResolver: async (migrationPath) =>
          import(pathToFileURL(migrationPath).href),
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
