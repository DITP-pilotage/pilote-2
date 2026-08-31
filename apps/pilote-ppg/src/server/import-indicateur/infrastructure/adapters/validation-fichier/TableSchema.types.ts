export type TableSchemaFieldType = "string" | "number";

export type TableSchemaFieldConstraints = {
  required?: boolean;
  pattern?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
};

export type TableSchemaField = {
  name: string;
  type: TableSchemaFieldType;
  constraints?: TableSchemaFieldConstraints;
};

export type TableSchema = {
  fields: TableSchemaField[];
  primaryKey: string[];
};

export type TypeViolation =
  | "required"
  | "pattern"
  | "enum"
  | "type"
  | "minimum"
  | "maximum"
  | "primaryKey-duplicate"
  | "primaryKey-vide";

export type ViolationContrainte = {
  type: TypeViolation;
  nomDuChamp: string;
  cellule: string;
  ligneDeDonnees: number;
};
