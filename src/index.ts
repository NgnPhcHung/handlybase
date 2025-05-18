import express, { Express } from "express";
import { bootstrapApp } from "../core/base/startApp";
import "dotenv/config";
import { limiter } from "../core/base/rateLimt";
import { AppController } from "./controllers/app.controller";

const app: Express = express();
app.use(express.json());

function bootstrap() {
  bootstrapApp({
    expressApp: app,
    controllers: [AppController],
    parentPath: "api",
  });

  app.use(limiter());
}

bootstrap();
app.listen(process.env.APP_PORT, () =>
  console.info("Running on: ", process.env.APP_PORT),
);
