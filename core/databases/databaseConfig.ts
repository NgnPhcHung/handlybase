export type DatabaseType = "postgres" | "mysql" | "sqlite";

export type DatabaseConfig = CommonConfig & SqliteConfig;

type CommonConfig = {
  type: "sqlite";
};
export type SqliteConfig = CommonConfig & {
  config: {
    connectionString: string;
    verbose?: () => void;
    timeout?: number;
  };
};

export type SqlConfig = CommonConfig & {
  config: {
    sqlConfig?: number;
  };
};
