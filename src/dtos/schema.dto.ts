import { PropertyType } from "../../core/parser";

export class SchemaRootDto {
  dbname!: string;
  collections!: CollectionSchemaDto[];
}

export class CollectionSchemaDto {
  name!: string;
  fields!: FieldPropertiesDto[];
  references?: SchemaReferenceDto[];
}

export class SchemaReferenceDto {
  key!: string;
  targetTable!: string;
  targetKey!: string;
}

export class FieldPropertiesDto {
  name!: string;

  primarykey?: boolean;

  autoincreasement?: boolean;

  type!: PropertyType;

  required?: boolean;

  unique?: boolean;

  oncreate?: boolean;

  onupdate?: boolean;

  presentable?: boolean;

  default?: any;
}
