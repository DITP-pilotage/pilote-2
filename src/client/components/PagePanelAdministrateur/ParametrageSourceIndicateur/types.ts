export interface ValeurAccepte {
  ordre: number;
  valeur: string;
  nom: string;
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
  validationRegexErrorMessage: string | null;
  editBoxType: "text" | "textarea" | "boolean" | "multi-select" | null;
  defaultValue: string | number | null | boolean;
  estObligatoire: boolean;
  doitAfficherLaDescription: boolean;
  listeValeursAcceptes: ValeurAccepte[];
}
