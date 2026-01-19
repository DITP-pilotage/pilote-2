import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaTransaction, getPrisma } from "@/server/db/PrismaTransaction";

const valeurAccepteeSchema = z.object({
  ordre: z.number(),
  valeur: z.string(),
  nom: z.string(),
  description: z.string(),
});

const metadataIndicateurSchema = z.object({
  name: z.string(),
  dataType: z.enum(["text", "boolean", "number"]),
  description: z.string(),
  estVisible: z.boolean(),
  alias: z.string(),
  estEditable: z.boolean(),
  validationRegex: z.string(),
  validationRegexErrorMessage: z.string().nullable(),
  editBoxType: z
    .enum(["text", "textarea", "boolean", "multi-select"])
    .nullable(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  estObligatoire: z.boolean(),
  doitAfficherLaDescription: z.boolean(),
  listeValeursAcceptes: z.array(valeurAccepteeSchema),
  groupe: z.enum([
    "METADATA_INDICATEURS",
    "METADATA_PARAMETRAGE_INDICATEURS",
    "METADATA_INDICATEURS_COMPLEMENTAIRE",
  ]),
  blocId: z.number().nullable(),
});

export const enregistrerMetadataIndicateurCommandSchema = z.object({
  metadataList: z.array(metadataIndicateurSchema),
});

export type EnregistrerMetadataIndicateurCommand = z.infer<
  typeof enregistrerMetadataIndicateurCommandSchema
>;

export class EnregistrerMetadataIndicateurHandler {
  constructor(
    private readonly dependencies: {
      prisma: PrismaPilote;
      transaction: PrismaTransaction;
    },
  ) {}

  async execute(command: EnregistrerMetadataIndicateurCommand): Promise<void> {
    await this.dependencies.transaction.run(async () => {
      const prisma = getPrisma();

      // Récupérer toutes les métadonnées existantes
      const existingMetadata = await prisma.metadata_indicateur.findMany({
        select: { name: true },
      });

      const existingNames = new Set(existingMetadata.map((m) => m.name));
      const newNames = new Set(command.metadataList.map((m) => m.name));

      // Supprimer les métadonnées qui ne sont plus dans la liste
      const namesToDelete = [...existingNames].filter(
        (name) => !newNames.has(name),
      );

      if (namesToDelete.length > 0) {
        await prisma.metadata_indicateur.deleteMany({
          where: {
            name: {
              in: namesToDelete,
            },
          },
        });
      }

      // Upsert chaque métadonnée
      for (const metadata of command.metadataList) {
        // D'abord, supprimer les valeurs acceptées existantes pour cette métadonnée
        await prisma.metadata_indicateur_valeur_acceptee.deleteMany({
          where: {
            metadata_indicateur_name: metadata.name,
          },
        });

        // Convertir defaultValue en string pour la BDD
        const defaultValueString = this.convertDefaultValueToString(
          metadata.defaultValue,
        );

        // Upsert la métadonnée
        await prisma.metadata_indicateur.upsert({
          where: {
            name: metadata.name,
          },
          create: {
            name: metadata.name,
            data_type: metadata.dataType,
            description: metadata.description,
            est_visible: metadata.estVisible,
            alias: metadata.alias,
            est_editable: metadata.estEditable,
            validation_regex: metadata.validationRegex,
            validation_regex_error_message:
              metadata.validationRegexErrorMessage,
            edit_box_type: metadata.editBoxType,
            default_value: defaultValueString,
            est_obligatoire: metadata.estObligatoire,
            doit_afficher_la_description: metadata.doitAfficherLaDescription,
            groupe: metadata.groupe,
            bloc_id: metadata.blocId,
          },
          update: {
            data_type: metadata.dataType,
            description: metadata.description,
            est_visible: metadata.estVisible,
            alias: metadata.alias,
            est_editable: metadata.estEditable,
            validation_regex: metadata.validationRegex,
            validation_regex_error_message:
              metadata.validationRegexErrorMessage,
            edit_box_type: metadata.editBoxType,
            default_value: defaultValueString,
            est_obligatoire: metadata.estObligatoire,
            doit_afficher_la_description: metadata.doitAfficherLaDescription,
            groupe: metadata.groupe,
            bloc_id: metadata.blocId,
          },
        });

        // Créer les nouvelles valeurs acceptées
        if (metadata.listeValeursAcceptes.length > 0) {
          await prisma.metadata_indicateur_valeur_acceptee.createMany({
            data: metadata.listeValeursAcceptes.map((valeur) => ({
              metadata_indicateur_name: metadata.name,
              ordre: valeur.ordre,
              valeur: valeur.valeur,
              nom: valeur.nom,
              description: valeur.description,
            })),
          });
        }
      }
    });
  }

  private convertDefaultValueToString(
    value: string | number | boolean | null,
  ): string | null {
    if (value === null) {
      return null;
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return value;
  }
}
