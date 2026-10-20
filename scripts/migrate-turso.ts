import 'dotenv/config';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';
import Umzug from 'umzug';
import { createTursoMigrationStorage } from '../src/api/tursoMigrationStorage.js';

type MigrationCommand = 'up' | 'down' | 'pending' | 'executed';

const isMigrationCommand = (command: string): command is MigrationCommand =>
  ['up', 'down', 'pending', 'executed'].includes(command);

const runMigrations = async (command = 'up') => {
  if (!isMigrationCommand(command)) {
    throw new Error('Command must be one of: up, down, pending, executed');
  }

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Turso database environment variables are required');
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const migrationsDirectory = path.resolve(process.cwd(), 'migrations');
  const storage = createTursoMigrationStorage(client, migrationsDirectory);

  try {
    await storage.ensureTable();

    const umzug = new Umzug({
      migrations: {
        path: migrationsDirectory,
        pattern: /^\d+[\w-]+\.js$/,
        params: [client],
        customResolver: async (migrationPath) =>
          import(pathToFileURL(migrationPath).href),
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

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  runMigrations(process.argv[2]).catch((error) => {
    console.error('Turso migration command failed', error);
    process.exitCode = 1;
  });
}

export { runMigrations };
