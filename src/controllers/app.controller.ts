import { Request } from "express";
import {
  Controller,
  Post,
  Body,
  Req,
  Authorization,
} from "../../core/decorators";
import { SchemaRootDto } from "../dtos/schema.dto";
import { AppService } from "../services/app.service";
import { UserController } from "./user.controller";

@Controller({
  path: "/app",
  children: [UserController],
})
@Authorization()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post("/check-health")
  async checkHeath(@Req() req: Request) {
    req;
    return "ok";
  }

  @Post("/import-schema")
  async importSchema(@Body() body: SchemaRootDto) {
    return this.appService.importSchema(body);
  }
}
