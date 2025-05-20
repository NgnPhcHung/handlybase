// import { DatabaseConfig } from "./databaseConfig";
//
// export class Database {
//   private static instance: Database | null = null;
//   private constructor() {}
//   private database!: DatabaseConfig;
//
//   static setUpdateDatabase(): Database {
//     if (!Database.instance) {
//       Database.instance = new Database();
//     }
//     return Database.instance;
//   }
//
//   public connect(): void {
//     console.log("Connecting to database...");
//     setTimeout(() => {
//       this.database();
//       console.log("Database connected");
//     }, 1000);
//   }
//
//   public query(sql: string): void {
//     console.log(`Executing query: ${sql}`);
//     setTimeout(() => {
//       console.log("Query executed");
//     }, 500);
//   }
//
//   public disconnect(): void {
//     console.log("Disconnecting from database...");
//     setTimeout(() => {
//       console.log("Database disconnected");
//     }, 500);
//   }
// }
