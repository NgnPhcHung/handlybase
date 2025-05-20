import express, { Express } from "express";
import "dotenv/config";
import { AppController } from "./controllers/app.controller";
import { bootstrapApp, container, DatabaseFactory, limiter } from "../core";
import { DatabaseClient } from "../core/databases/databaseClient";

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
