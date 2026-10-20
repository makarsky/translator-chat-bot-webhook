import path from 'node:path';
import type { Client } from '@libsql/client' with {
  'resolution-mode': 'import',
};

const migrationTable = 'umzug_migrations';

type Database = Pick<Client, 'execute'>;

const createTursoMigrationStorage = (
  database: Database,
  migrationsDirectory: string,
) => ({
  async ensureTable() {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS ${migrationTable} (
        name TEXT PRIMARY KEY,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async logMigration(migrationPath: string) {
    await database.execute({
      sql: `INSERT INTO ${migrationTable} (name) VALUES (?)`,
      args: [path.basename(migrationPath)],
    });
  },

  async unlogMigration(migrationPath: string) {
    await database.execute({
      sql: `DELETE FROM ${migrationTable} WHERE name = ?`,
      args: [path.basename(migrationPath)],
    });
  },

  async executed() {
    const result = await database.execute(
      `SELECT name FROM ${migrationTable} ORDER BY name`,
    );

    return result.rows.map((row) =>
      path.join(migrationsDirectory, String(row.name)),
    );
  },
});

export { createTursoMigrationStorage };
