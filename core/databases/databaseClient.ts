export abstract class DatabaseClient {
  abstract connect(): Promise<void>;
  abstract query<T>(sql: string, params?: any[]): Promise<T>;
}
