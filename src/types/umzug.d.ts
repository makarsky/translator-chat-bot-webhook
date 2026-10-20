declare module 'umzug' {
  interface Migration {
    file: string;
  }

  interface MigrationModule {
    up?: (...args: never[]) => unknown;
    down?: (...args: never[]) => unknown;
  }

  interface MigrationStorage {
    executed(): Promise<string[]>;
    logMigration(migrationPath: string): Promise<unknown>;
    unlogMigration(migrationPath: string): Promise<unknown>;
  }

  interface Options {
    migrations: {
      path: string;
      pattern: RegExp;
      params: unknown[];
      customResolver: (migrationPath: string) => Promise<MigrationModule>;
    };
    storage: MigrationStorage;
    logging: false | ((message: string) => void);
  }

  class Umzug {
    constructor(options: Options);
    pending(): Promise<Migration[]>;
    up(
      options?: string | string[] | Record<string, unknown>,
    ): Promise<Migration[]>;
    down(
      options?: string | string[] | Record<string, unknown>,
    ): Promise<Migration[]>;
    executed(): Promise<Migration[]>;
  }

  export = Umzug;
}
