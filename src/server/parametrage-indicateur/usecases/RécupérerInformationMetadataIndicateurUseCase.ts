import { InformationMetadataIndicateur } from "@/server/parametrage-indicateur/domain/InformationMetadataIndicateur";
import { InformationMetadataIndicateurRepository } from "@/server/parametrage-indicateur/domain/ports/InformationMetadataIndicateurRepository";
import { AcceptedValue } from "@/server/parametrage-indicateur/domain/AcceptedValue";
import { PrismaPilote } from "@/server/db/PrismaPilote";

type Dependencies = {
  informationMetadataIndicateurRepository: InformationMetadataIndicateurRepository;
  prisma: PrismaPilote;
};

export default class RécupérerInformationMetadataIndicateurUseCase {
  constructor(private readonly dependencies: Dependencies) {}

  async run(): Promise<InformationMetadataIndicateur[]> {
    const anciennesDonnees =
      this.dependencies.informationMetadataIndicateurRepository.récupererInformationMetadataIndicateur();

    const nouvellesDonnees = await this.récupérerDepuisBDD();

    this.comparerDonnées(anciennesDonnees, nouvellesDonnees);

    return nouvellesDonnees;
  }

  private async récupérerDepuisBDD(): Promise<InformationMetadataIndicateur[]> {
    const prisma = this.dependencies.prisma.getInstance();
    const metadataFromDB = await prisma.metadata_indicateur.findMany({
      include: {
        valeurs_acceptees: {
          orderBy: {
            ordre: "asc",
          },
        },
      },
    });

    return metadataFromDB.map((metadata) => this.mapperDepuisBDD(metadata));
  }

  private mapperDepuisBDD(metadata: {
    name: string;
    data_type: string;
    description: string;
    est_visible: boolean;
    alias: string;
    est_editable: boolean;
    validation_regex: string;
    validation_regex_error_message: string | null;
    edit_box_type: string | null;
    default_value: string | null;
    est_obligatoire: boolean;
    doit_afficher_la_description: boolean;
    valeurs_acceptees: {
      ordre: number;
      valeur: string;
      nom: string;
      description: string;
    }[];
  }): InformationMetadataIndicateur {
    const defaultValue = this.convertirDefaultValue(
      metadata.default_value,
      metadata.data_type,
    );

    const acceptedValues = metadata.valeurs_acceptees.map((valeur) =>
      AcceptedValue.créerAcceptedValue({
        orderId: valeur.ordre,
        value: valeur.valeur,
        name: valeur.nom,
        desc: valeur.description,
      }),
    );

    return InformationMetadataIndicateur.creerInformationMetadataIndicateur({
      name: metadata.name,
      dataType: metadata.data_type as "text" | "boolean",
      description: metadata.description,
      metaPiloteShow: metadata.est_visible,
      metaPiloteAlias: metadata.alias,
      metaPiloteEditIsEditable: metadata.est_editable,
      metaPiloteEditRegex: metadata.validation_regex,
      metaPiloteEditRegexViolationMessage:
        metadata.validation_regex_error_message,
      metaPiloteEditBoxType: (metadata.edit_box_type || "text") as
        | "text"
        | "textarea"
        | "boolean"
        | "multi-select",
      metaPiloteDefaultValue: defaultValue,
      metaPiloteMandatory: metadata.est_obligatoire,
      metaPiloteDispDispDesc: metadata.doit_afficher_la_description,
      acceptedValues,
    });
  }

  private convertirDefaultValue(
    value: string | null,
    dataType: string,
  ): string | number | boolean | null {
    if (value === null) {
      return null;
    }

    if (dataType === "boolean") {
      return value === "true";
    }

    if (dataType === "number") {
      return Number(value);
    }

    return value;
  }

  private normaliserValeur(valeur: unknown): unknown {
    if (typeof valeur === "string") {
      return valeur.trim();
    }
    return valeur;
  }

  private comparerDonnées(
    anciennesDonnees: InformationMetadataIndicateur[],
    nouvellesDonnees: InformationMetadataIndicateur[],
  ): void {
    // eslint-disable-next-line no-console
    console.log("=== Comparaison des données YAML vs BDD ===");
    // eslint-disable-next-line no-console
    console.log(`Nombre d'éléments YAML: ${anciennesDonnees.length}`);
    // eslint-disable-next-line no-console
    console.log(`Nombre d'éléments BDD: ${nouvellesDonnees.length}`);

    const anciensParNom = new Map(
      anciennesDonnees.map((data) => [data.name, data]),
    );
    const nouveauxParNom = new Map(
      nouvellesDonnees.map((data) => [data.name, data]),
    );

    const tousLesNoms = new Set([
      ...anciensParNom.keys(),
      ...nouveauxParNom.keys(),
    ]);

    const différences: Array<{
      name: string;
      champ: string;
      ancienne: unknown;
      nouvelle: unknown;
    }> = [];

    for (const nom of tousLesNoms) {
      const ancien = anciensParNom.get(nom);
      const nouveau = nouveauxParNom.get(nom);

      if (!ancien) {
        // eslint-disable-next-line no-console
        console.log(`❌ Metadata "${nom}" présent en BDD mais absent du YAML`);
        continue;
      }

      if (!nouveau) {
        // eslint-disable-next-line no-console
        console.log(
          `❌ Metadata "${nom}" présent dans YAML mais absent de la BDD`,
        );
        continue;
      }

      const champsÀComparer: Array<keyof InformationMetadataIndicateur> = [
        "name",
        "dataType",
        "description",
        "metaPiloteShow",
        "metaPiloteAlias",
        "metaPiloteEditIsEditable",
        "metaPiloteEditRegex",
        "metaPiloteEditRegexViolationMessage",
        "metaPiloteEditBoxType",
        "metaPiloteDefaultValue",
        "metaPiloteMandatory",
        "metaPiloteDispDispDesc",
      ];

      for (const champ of champsÀComparer) {
        const valeurAncienne = this.normaliserValeur(ancien[champ]);
        const valeurNouvelle = this.normaliserValeur(nouveau[champ]);

        if (valeurAncienne !== valeurNouvelle) {
          différences.push({
            name: nom,
            champ: champ as string,
            ancienne: valeurAncienne,
            nouvelle: valeurNouvelle,
          });
        }
      }

      if (ancien.acceptedValues.length !== nouveau.acceptedValues.length) {
        différences.push({
          name: nom,
          champ: "acceptedValues.length",
          ancienne: ancien.acceptedValues.length,
          nouvelle: nouveau.acceptedValues.length,
        });
      } else {
        for (let index = 0; index < ancien.acceptedValues.length; index++) {
          const ancienValue = ancien.acceptedValues[index];
          const nouveauValue = nouveau.acceptedValues[index];

          if (ancienValue.orderId !== nouveauValue.orderId) {
            différences.push({
              name: nom,
              champ: `acceptedValues[${index}].orderId`,
              ancienne: ancienValue.orderId,
              nouvelle: nouveauValue.orderId,
            });
          }

          const ancienneValeur = this.normaliserValeur(ancienValue.value);
          const nouvelleValeur = this.normaliserValeur(nouveauValue.value);
          if (ancienneValeur !== nouvelleValeur) {
            différences.push({
              name: nom,
              champ: `acceptedValues[${index}].value`,
              ancienne: ancienneValeur,
              nouvelle: nouvelleValeur,
            });
          }

          const ancienNom = this.normaliserValeur(ancienValue.name);
          const nouveauNom = this.normaliserValeur(nouveauValue.name);
          if (ancienNom !== nouveauNom) {
            différences.push({
              name: nom,
              champ: `acceptedValues[${index}].name`,
              ancienne: ancienNom,
              nouvelle: nouveauNom,
            });
          }

          const ancienneDesc = this.normaliserValeur(ancienValue.desc);
          const nouvelleDesc = this.normaliserValeur(nouveauValue.desc);
          if (ancienneDesc !== nouvelleDesc) {
            différences.push({
              name: nom,
              champ: `acceptedValues[${index}].desc`,
              ancienne: ancienneDesc,
              nouvelle: nouvelleDesc,
            });
          }
        }
      }
    }

    if (différences.length === 0) {
      // eslint-disable-next-line no-console
      console.log("✅ Aucune différence trouvée entre le YAML et la BDD");
    } else {
      // eslint-disable-next-line no-console
      console.log(`⚠️  ${différences.length} différence(s) trouvée(s):`);
      for (const diff of différences) {
        // eslint-disable-next-line no-console
        console.log(`  - ${diff.name}.${diff.champ}:`);
        // eslint-disable-next-line no-console
        console.log(`    YAML: ${JSON.stringify(diff.ancienne)}`);
        // eslint-disable-next-line no-console
        console.log(`    BDD:  ${JSON.stringify(diff.nouvelle)}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log("===========================================");
  }
}
