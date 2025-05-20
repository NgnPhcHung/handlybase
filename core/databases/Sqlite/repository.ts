import { BaseRepository } from "../../infra/baseRepository";

export abstract class SqlRepository<T> implements BaseRepository<T> {
  findAll(): Promise<T[]> {
    throw new Error("Method not implemented.");
  }
  findOne(id: number): Promise<T | null> {
    throw new Error("Method not implemented.");
  }
  save(entity: T): Promise<void> {
    throw new Error("Method not implemented.");
  }
  delete(id: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
