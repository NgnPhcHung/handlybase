import { unlink } from "fs/promises";
import path from "path";
import JWT from "jsonwebtoken";

import { SchemaRootDto } from "../dtos/schema.dto";
import {
  appendOrCreate,
  BaseRepository,
  DatabaseClient,
  ensureDir,
  HttpStatus,
  Injectable,
  interfaceHanlders,
  SqlMapper,
} from "@core";
import { LoginDto } from "src/dtos/login.dto";
import bcrypt from "bcryptjs";
import { USER_ROLE } from "handly/consts";
import { _SUPER_DATABASE } from "handly/adminSettings";

@Injectable()
export class AppService extends BaseRepository<_SUPER_DATABASE> {
  constructor(db: DatabaseClient) {
    super(_SUPER_DATABASE);
  }

  async importSchema(payload: SchemaRootDto) {
    try {
      const mapper = new SqlMapper(payload);
      const { query } = mapper.createTableQuery();

      for await (const q of query) {
        await this.execute(q.trim());
      }
      this.execute(` INSERT INTO _super_database (username, password)
VALUES ('${process.env.ADMIN_USERNAME}', '${process.env.ADMIN_PASSWORD_HASH}');
`);

      let content = "";
      for (const collection of payload.collections) {
        const handler = interfaceHanlders(collection.name);
        for (const field of collection.fields) {
          handler.toPropety(field);
        }
        content += "\n" + handler.values();
      }

      await unlink("handly/schemas.ts");
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

  async login(body: LoginDto) {
    const admin = await this.findOne({ where: { username: body.username } });

    if (!admin) {
      throw new Error(HttpStatus.UNAUTHORIZED.toString());
    }

    const descryped = bcrypt.compareSync(body.password, admin.password);

    if (!descryped) {
      throw new Error(HttpStatus.UNAUTHORIZED.toString());
    }
    const accessToken = JWT.sign(
      { id: admin.id, role: USER_ROLE.SUPER_ADMIN },
      process.env.JWT_ACCESS_SECRET_KEY || "",
      {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRED_IN) || 15 * 60,
      },
    );
    const refreshToken = JWT.sign(
      { id: admin.id, role: USER_ROLE.SUPER_ADMIN },
      process.env.JWT_REFRESH_SECRET_KEY || "",
      {
        expiresIn:
          Number(process.env.REFRESH_TOKEN_EXPIRED_IN) || 7 * 24 * 60 * 60,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
