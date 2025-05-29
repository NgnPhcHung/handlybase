import { SchemaRootDto } from "../dtos/schema.dto";
import { BaseRepository } from "../../core/databases/baseRepository";
import { DatabaseClient } from "../../core/databases/databaseClient";
import { Injectable } from "../../core/decorators";
import { AnyClass } from "../../core";
import path from "path";
import { appendOrCreate, ensureDir } from "../../core/utils";
import { SqlMapper, interfaceHanlders } from "../../core/parser";

@Injectable()
export class AppService extends BaseRepository<AnyClass> {
  constructor(db: DatabaseClient) {
    super({} as AnyClass);
  }

  async importSchema(payload: SchemaRootDto) {
    try {
      const mapper = new SqlMapper(payload);
      const { query } = mapper.createTableQuery();

      for await (const q of query) {
        await this.execute(q.trim());
      }

      let content = "";
      for (const collection of payload.collections) {
        const handler = interfaceHanlders(collection.name);
        for (const field of collection.fields) {
          handler.toPropety(field);
        }
        content += "\n" + handler.values();
      }
      await interfaceHanlders("").toInterfaceFile(
        "./handly/",
        "schemas.ts",
        content,
      );

      const migrationDir = path.resolve(process.cwd(), "handly/snapshot");
      await ensureDir(migrationDir);
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T.]/g, "")
        .slice(0, 14);
      const migrationFile = path.join(migrationDir, `${timestamp}.json`);
      await appendOrCreate(migrationFile, JSON.stringify(payload.collections));
    } catch (error) {
      throw error;
    }
  }
}
