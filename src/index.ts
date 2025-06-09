import "reflect-metadata";
import "module-alias/register";
import "dotenv/config";

import express, { Express } from "express";
import { AppController } from "./controllers/app.controller";
import { datasource } from "./datasource";
import { bootstrapApp, container, DatabaseClient } from "@core";
import { limiter } from "@core";
import cors from "cors";

const app: Express = express();
app.use(express.json());

async function bootstrap() {
  const db = datasource;
  await db.connect();

  app.use(limiter());
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    }),
  );

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
