export type DatabaseType = "postgres" | "mysql" | "sqlite";

export type DatabaseConfig = CommonConfig & SqliteConfig;

type CommonConfig = {
  type: "sqlite";
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
