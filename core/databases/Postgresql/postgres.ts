// import { DatabaseClient } from "../databaseClient";
//
// export class PostgresClient implements DatabaseClient {
//   private static instance: PostgresClient;
//   private pool!: Pool;
//
//   private constructor(private dbConfig: Record<string, any>) {}
//
//   static getInstance(config: Record<string, any>): PostgresClient {
//     if (!PostgresClient.instance) {
//       PostgresClient.instance = new PostgresClient(config);
//     }
//     return PostgresClient.instance;
//   }
//
//   async connect() {
//     if (this.pool) return;
//     this.pool = new Pool(this.dbConfig);
//     await this.pool.connect();
//     console.log("PostgreSQL connected");
//   }
//
//   async query<T>(sql: string, params?: any[]): Promise<T> {
//     const result = await this.pool.query(sql, params);
//     return result.rows as T;
//   }
//
//   async disconnect() {
//     await this.pool.end();
//     console.log("PostgreSQL disconnected");
//   }
// }
