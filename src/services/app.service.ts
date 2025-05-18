import { Injectable } from "../../core/decorators/injectable";
import { EntityManager } from "../../core/infra/entityManager";
import { SqlMapper } from "../../core/parser/sqlMapper";
import { SchemaRootDto } from "../dtos/schema.dto";
import { Users } from "../entities/schemas";

@Injectable()
export class AppService extends EntityManager<Users> {
  entityClass = Users;

  async handleSchemaImport(payload: SchemaRootDto) {
    const mapper = new SqlMapper(payload);
    const res = mapper.createTableQuery();
    this.db.exec(res.trim());
  }

  async createUser(body: any) {
    const stmt = this.db.prepare(
      "INSERT INTO users(username, email, password, updatedAt, createdAt, isActive) VALUES(@username, @email, @password, @updatedAt, @createdAt, @isActive)",
    );
    const queries = this.db.transaction((u) => {
      stmt.run(...u);
    });
    queries([
      {
        username: "test2",
        email: "test1@email.com",
        password: "123",
        updatedAt: "123333",
        createdAt: "111",
        isActive: 0,
      },
    ]);
  }

  async login(body: any) {
    return this.findOne({ id: 1 });
  }
}
