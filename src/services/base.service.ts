import { BaseRepository } from "../../core/databases/baseRepository";
import { DatabaseClient } from "../../core/databases/databaseClient";
import { Users } from "../entities/schemas";

export class BaseService extends BaseRepository<Users> {
  constructor(db: DatabaseClient) {
    super(Users, db);
  }
  find(entity: Partial<Users>) {
    return super.find({ id: 3 });
  }
}
