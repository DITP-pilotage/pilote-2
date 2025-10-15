export interface ValeurAccepte {
  ordre: number;
  value: string;
  name: string;
  description: string;
}

export interface MetadataIndicateurForm {
  name: string;
  dataType: "text" | "boolean" | "number";
  description: string;
  estVisible: boolean;
  alias: string;
  estEditable: boolean;
  validationRegex: string;
  metaPiloteEditRegexViolationMessage: string | null;
  editBoxType: "text" | "textarea" | "boolean" | "multi-select" | null;
  defaultValue: string | number | null | boolean;
  estObligatoire: boolean;
  doitAfficherLaDescription: boolean;
  listeValeursAcceptes: ValeurAccepte[];
}
