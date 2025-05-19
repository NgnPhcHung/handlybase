import express, { Express } from "express";
import "dotenv/config";
import { AppController } from "./controllers/app.controller";
import { limiter } from "../core/rateLimt";
import { bootstrapApp } from "../core/startApp";

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
