require('dotenv').config();

const path = require('path');
const { createClient } = require('@libsql/client');
const Umzug = require('umzug');
const {
  createTursoMigrationStorage,
} = require('../src/api/tursoMigrationStorage');

const runMigrations = async (command = 'up') => {
  if (!['up', 'down', 'pending', 'executed'].includes(command)) {
    throw new Error('Command must be one of: up, down, pending, executed');
  }

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Turso database environment variables are required');
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const migrationsDirectory = path.resolve(__dirname, '../migrations');
  const storage = createTursoMigrationStorage(client, migrationsDirectory);

  try {
    await storage.ensureTable();

    const umzug = new Umzug({
      migrations: {
        path: migrationsDirectory,
        pattern: /^\d+[\w-]+\.js$/,
        params: [client],
      },
      storage,
      logging: console.log,
    });

    const migrations = await umzug[command]();
    console.log(`${command}: ${migrations.length} migration(s)`);
    return migrations;
  } finally {
    client.close();
  }
};

if (require.main === module) {
  runMigrations(process.argv[2]).catch((error) => {
    console.error('Turso migration command failed', error);
    process.exitCode = 1;
  });
}

module.exports = { runMigrations };
