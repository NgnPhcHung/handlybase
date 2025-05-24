import "reflect-metadata";

import express, { Express } from "express";
import "dotenv/config";
import { DatabaseClient } from "../core/databases/databaseClient";
import { DatabaseFactory } from "../core/databases/databaseFactory";
import { container, bootstrapApp } from "../core/startApp";
import { AppController } from "./controllers/app.controller";
import { limiter } from "../core/helpers";

const app: Express = express();
app.use(express.json());

async function bootstrap() {
  const db = DatabaseFactory.getDatabase({
    type: "sqlite",
    config: {
      connectionString: "database.db",
    },
  });

  await db.connect();

  app.use(limiter());
  container.register(DatabaseClient, db);

  bootstrapApp({
    expressApp: app,
    controllers: [AppController],
    parentPath: "api",
  });
}

bootstrap();
app.listen(process.env.APP_PORT, () =>
  console.info("Running on: ", process.env.APP_PORT),
);
