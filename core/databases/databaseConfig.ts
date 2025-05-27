export type DatabaseType = "postgres" | "mysql" | "sqlite";

export type DatabaseConfig = CommonConfig & SqliteConfig;

interface MigrationOpts {
  migration: boolean;
  table?: string;
  migrationFolder?: string;
}

type CommonConfig = {
  type: "sqlite";
};
export type SqliteConfig = {
  config: {
    connectionString: string;
    verbose?: () => void;
    timeout?: number;
    migration?: MigrationOpts;
  };
};

export type SqlConfig = {
  config: {
    sqlConfig?: number;
  };
};
