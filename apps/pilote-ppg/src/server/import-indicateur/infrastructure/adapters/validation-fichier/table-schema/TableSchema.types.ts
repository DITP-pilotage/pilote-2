export type TableSchemaContraintesBrutes = {
  required?: boolean;
  pattern?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
};

export type TableSchemaChampBrut = {
  name: string;
  type: "string" | "number";
  /** Valeur d'exemple du schéma, citée dans les messages d'erreur. */
  example?: string;
  constraints?: TableSchemaContraintesBrutes;
};

export type TableSchemaBrut = {
  name: string;
  fields: TableSchemaChampBrut[];
  primaryKey: string[];
};

export type TypeViolation =
  | "required"
  | "pattern"
  | "enum"
  | "type"
  | "minimum"
  | "maximum"
  | "primary-key"
  | "blank-row"
  | "missing-cell";

export type ViolationContrainte = {
  type: TypeViolation;
  nomDuChamp: string | null;
  /** -1 quand la violation ne porte pas sur une colonne précise. */
  indexDeColonne: number;
  cellule: string | null;
  /** Index dans `lignes`, 0-based. */
  indexDeLigne: number;
};

export type ChampCompile = {
  nom: string;
  /** Valeur d'exemple du schéma, citée dans les messages d'erreur. */
  exemple: string | null;
  estNombre: boolean;
  /** -1 quand le champ est absent du fichier (schema_sync). */
  indexDeColonne: number;
  requis: boolean;
  motif: RegExp | null;
  valeursAutorisees: Set<string> | null;
  minimum: number | null;
  maximum: number | null;
};

export type SchemaCompile = {
  nom: string;
  champs: ChampCompile[];
  indexColonnesClePrimaire: number[];
  /**
   * Colonnes de la clé primaire absentes du fichier. Contrairement aux autres
   * colonnes manquantes, qui sont simplement ignorées, celles-ci sont
   * bloquantes : sans elles, ni identification ni dédoublonnage possibles.
   */
  colonnesClePrimaireAbsentes: string[];
};
