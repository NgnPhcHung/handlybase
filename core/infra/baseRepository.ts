export interface BaseRepository<T> {
  findAll(): Promise<T[]>;
  findOne(id: number): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: number): Promise<void>;
}
