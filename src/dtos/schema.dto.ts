import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PropertyType } from "../parser";

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

  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => FieldPropertiesDto)
  fields!: FieldPropertiesDto[];

  @ValidateNested()
  @IsArray()
  @Type(() => SchemaReference)
  references?: SchemaReference[];
}

export class SchemaReference {
  @IsString()
  key!: string;
  @IsString()
  targetTable!: string;
  @IsString()
  targetKey!: string;
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
