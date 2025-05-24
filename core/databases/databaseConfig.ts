export type DatabaseType = "postgres" | "mysql" | "sqlite";

export type DatabaseConfig = CommonConfig & SqliteConfig;

interface MigrationOpts {
  migration: boolean;
  talbe?: string;
  migrationFolder?: string;
}

type CommonConfig = {
  type: "sqlite";
  migration?: MigrationOpts;
};
export type SqliteConfig = {
  config: {
    connectionString: string;
    verbose?: () => void;
    timeout?: number;
  };
};

export type SqlConfig = {
  config: {
    sqlConfig?: number;
  };
};
