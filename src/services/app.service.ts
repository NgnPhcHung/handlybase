import { SchemaRootDto } from "../dtos/schema.dto";
import { Users } from "../entities/schemas";
import { BaseRepository } from "../../core/databases/baseRepository";
import { DatabaseClient } from "../../core/databases/databaseClient";
import { Injectable } from "../decorators";
import { SqlMapper } from "../parser";

@Injectable()
export class AppService extends BaseRepository<Users> {
  constructor(db: DatabaseClient) {
    super(Users);
  }

  async importSchema(payload: SchemaRootDto) {
    try {
      const mapper = new SqlMapper(payload);
      const { autoFunction, query } = mapper.createTableQuery();
      await Promise.all([
        await this.execute(query.trim()),
        await this.execute(autoFunction.trim()),
      ]);
    } catch (error) {
      throw error;
    }
  }
}
