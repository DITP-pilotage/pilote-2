import type { Inject } from "@/server/parametrage-indicateur/module";

export interface ValeurAcceptee {
  ordre: number;
  valeur: string;
  nom: string;
  description: string;
}

export interface MetadataIndicateur {
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
  listeValeursAcceptes: ValeurAcceptee[];
  groupe:
    | "METADATA_INDICATEURS"
    | "METADATA_PARAMETRAGE_INDICATEURS"
    | "METADATA_INDICATEURS_COMPLEMENTAIRE";
  blocId: number | null;
}

export type GetMetadataIndicateurConfigurationViewModel = {
  listeMetadonneesIndicateur: MetadataIndicateur[];
};

export class GetMetadataIndicateurConfigurationQuery {
  constructor(private readonly dependencies: Inject<"prisma">) {}

  async run(): Promise<GetMetadataIndicateurConfigurationViewModel> {
    const metadataIndicateurs = await this.dependencies.prisma
      .getInstance()
      .metadata_indicateur.findMany({
        include: {
          valeurs_acceptees: {
            orderBy: {
              ordre: "asc",
            },
          },
        },
        orderBy: [
          {
            groupe: "asc",
          },
          {
            bloc_id: "asc",
          },
          {
            name: "asc",
          },
        ],
      });

    return {
      listeMetadonneesIndicateur: metadataIndicateurs.map((metadata) => ({
        name: metadata.name,
        dataType: metadata.data_type as "text" | "boolean" | "number",
        description: metadata.description,
        estVisible: metadata.est_visible,
        alias: metadata.alias,
        estEditable: metadata.est_editable,
        validationRegex: metadata.validation_regex,
        validationRegexErrorMessage: metadata.validation_regex_error_message,
        editBoxType: metadata.edit_box_type as
          | "text"
          | "textarea"
          | "boolean"
          | "multi-select"
          | null,
        defaultValue: metadata.default_value
          ? this.parseDefaultValue(
              metadata.default_value,
              metadata.data_type as "text" | "boolean" | "number",
            )
          : null,
        estObligatoire: metadata.est_obligatoire,
        doitAfficherLaDescription: metadata.doit_afficher_la_description,
        listeValeursAcceptes: metadata.valeurs_acceptees.map((valeur) => ({
          ordre: valeur.ordre,
          valeur: valeur.valeur,
          nom: valeur.nom,
          description: valeur.description,
        })),
        groupe: metadata.groupe as
          | "METADATA_INDICATEURS"
          | "METADATA_PARAMETRAGE_INDICATEURS"
          | "METADATA_INDICATEURS_COMPLEMENTAIRE",
        blocId: metadata.bloc_id,
      })),
    };
  }

  private parseDefaultValue(
    value: string,
    dataType: "text" | "boolean" | "number",
  ): string | number | boolean {
    if (dataType === "boolean") {
      return value === "true";
    }
    if (dataType === "number") {
      return Number.parseFloat(value);
    }
    return value;
  }
}
