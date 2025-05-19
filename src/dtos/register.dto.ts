import { IsBoolean, IsOptional, IsString } from "class-validator";

export class RegisterDto {
  @IsString()
  username!: string;

  @IsString()
  email!: string;

  @IsString()
  password!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
