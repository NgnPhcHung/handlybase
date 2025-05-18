import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PropertyType } from "../../core/parser/sqlTokens";
import { Type } from "class-transformer";

const propertyType: PropertyType[] = ["number", "text"];

export class SchemaRootDto {
  @IsString()
  dbname!: string;

  @Type(() => CollectionSchemaDto)
  collections!: CollectionSchemaDto[];
}

export class CollectionSchemaDto {
  @IsString()
  name!: string;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => FieldPropertiesDto)
  fields!: Record<string, FieldPropertiesDto>;
}

export class FieldPropertiesDto {
  @IsString()
  name!: string;

  @IsOptional()
  primarykey?: boolean;

  @IsOptional()
  autoincreasement?: boolean;

  @IsString()
  @IsIn(propertyType)
  type!: PropertyType;

  @IsOptional()
  required?: boolean;

  @IsOptional()
  unique?: boolean;

  @IsOptional()
  oncreate?: boolean;

  @IsOptional()
  onupdate?: boolean;

  @IsOptional()
  presentable?: boolean;

  @IsOptional()
  default?: any;
}
