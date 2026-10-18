const path = require('path');

const migrationTable = 'umzug_migrations';

const createTursoMigrationStorage = (database, migrationsDirectory) => ({
  async ensureTable() {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS ${migrationTable} (
        name TEXT PRIMARY KEY,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async logMigration(migrationPath) {
    await database.execute({
      sql: `INSERT INTO ${migrationTable} (name) VALUES (?)`,
      args: [path.basename(migrationPath)],
    });
  },

  async unlogMigration(migrationPath) {
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

module.exports = { createTursoMigrationStorage };
