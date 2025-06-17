import { Request } from "express";
import { Controller, Post, Body, Req, Authorize } from "../../core/decorators";
import { SchemaRootDto } from "../dtos/schema.dto";
import { AppService } from "../services/app.service";
import { LoginDto } from "src/dtos/login.dto";

@Controller({
  path: "/app",
  children: [],
})
@Authorize("UserRole.Admin")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Authorize("Request.checkHeath")
  @Post("/check-health")
  async checkHeath(@Req() req: Request) {
    req;
    return "ok";
  }

  @Post("/import-schema")
  async importSchema(@Body() body: SchemaRootDto) {
    return this.appService.importSchema(body);
  }

  @Post("/admin-login")
  async login(@Body() body: LoginDto) {
    return this.appService.login(body);
  }
}
