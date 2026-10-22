import {
  $Enums,
  metadata_chantiers,
  metadata_indicateurs_complementaire,
  metadata_indicateurs_hidden,
  metadata_parametrage_indicateurs,
  PrismaClient,
} from "@prisma/client";

import { creerAdapter } from "@/server/framework/persistence/adapter";

const prisma = new PrismaClient({ adapter: creerAdapter() });

const PROPOSITION_VALEUR_EVENEMENTS: $Enums.type_evenement[] = [
  "PROPOSITION_VALEUR_CREEE",
  "PROPOSITION_VALEUR_MODIFIEE",
  "PROPOSITION_VALEUR_SUPPRIMEE",
  "PROPOSITION_VALEUR_REFUSEE",
  "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
  "PROPOSITION_VALEUR_ACCEPTEE",
  "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
  "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
  "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
];

type ActionType =
  | "PROPOSITION_VALEUR_EVENEMENT_CREATED"
  | "COMMENTAIRE_CREATED"
  | "SYNTHESE_CREATED"
  | "OBJECTIF_CREATED"
  | "DECISION_STRATEGIQUE_CREATED"
  | "MESURE_INDICATEUR_IMPORTED"
  | "RAPPORT_IMPORT_CREATED"
  | "UTILISATEUR_CREATED"
  | "UTILISATEUR_DEACTIVATED"
  | "PROFIL_UTILISATEUR_UPDATED"
  | "TOKEN_API_CREATED"
  | "INDICATEUR_CREATED"
  | "INDICATEUR_UPDATED"
  | "CHANTIER_PARAMETRAGE_UPDATED"
  | "ALBERT_ACCESS_PROFIL_ENABLED"
  | "ALBERT_ACCESS_UTILISATEUR_ADDED";

type MetadataIndicateur = {
  hidden: metadata_indicateurs_hidden;
  parametrage: metadata_parametrage_indicateurs;
  complementaire: metadata_indicateurs_complementaire;
};

export async function readMetadataIndicateur(
  indicId: string,
): Promise<MetadataIndicateur> {
  const where = { indic_id: indicId };
  return {
    hidden: await prisma.metadata_indicateurs_hidden.findUniqueOrThrow({
      where,
    }),
    parametrage:
      await prisma.metadata_parametrage_indicateurs.findUniqueOrThrow({
        where,
      }),
    complementaire:
      await prisma.metadata_indicateurs_complementaire.findUniqueOrThrow({
        where,
      }),
  };
}

interface TrackedAction {
  type: ActionType;
  filters: Record<string, unknown>;
}

export class E2ETestContext {
  private readonly actions: TrackedAction[] = [];

  track(type: ActionType, filters: Record<string, unknown>): void {
    this.actions.push({ type, filters });
  }

  async cleanup(): Promise<void> {
    for (const action of this.actions) {
      switch (action.type) {
        case "PROPOSITION_VALEUR_EVENEMENT_CREATED":
          await prisma.indicateur_territoire_valeur_evenement.deleteMany({
            where: {
              ...action.filters,
              type_evenement: { in: PROPOSITION_VALEUR_EVENEMENTS },
            },
          });
          break;
        case "COMMENTAIRE_CREATED":
          await prisma.commentaire.deleteMany({
            where: action.filters,
          });
          break;
        case "SYNTHESE_CREATED":
          await prisma.synthese_des_resultats.deleteMany({
            where: action.filters,
          });
          break;
        case "OBJECTIF_CREATED":
          await prisma.objectif.deleteMany({
            where: action.filters,
          });
          break;
        case "DECISION_STRATEGIQUE_CREATED":
          await prisma.decision_strategique.deleteMany({
            where: action.filters,
          });
          break;
        case "MESURE_INDICATEUR_IMPORTED":
          await prisma.mesure_indicateur.deleteMany({
            where: action.filters,
          });
          break;
        case "RAPPORT_IMPORT_CREATED": {
          const rapports =
            await prisma.rapport_import_mesure_indicateur.findMany({
              where: action.filters,
              select: { id: true },
            });
          const rapportIds = rapports.map((rapport) => rapport.id);
          if (rapportIds.length > 0) {
            await prisma.mesure_indicateur.deleteMany({
              where: { rapport_id: { in: rapportIds } },
            });
            await prisma.mesure_indicateur_temporaire.deleteMany({
              where: { rapport_id: { in: rapportIds } },
            });
            await prisma.erreur_validation_fichier.deleteMany({
              where: { rapport_id: { in: rapportIds } },
            });
            await prisma.rapport_import_mesure_indicateur.deleteMany({
              where: { id: { in: rapportIds } },
            });
          }
          break;
        }
        case "UTILISATEUR_CREATED":
          await prisma.utilisateur.deleteMany({
            where: { email: action.filters.email as string },
          });
          break;
        case "INDICATEUR_CREATED": {
          const where = { indic_id: action.filters.indicId as string };
          await prisma.metadata_indicateurs_complementaire.deleteMany({
            where,
          });
          await prisma.metadata_parametrage_indicateurs.deleteMany({ where });
          await prisma.metadata_indicateurs_hidden.deleteMany({ where });
          break;
        }
        case "INDICATEUR_UPDATED": {
          const original = action.filters as MetadataIndicateur;
          const where = { indic_id: original.hidden.indic_id };
          await prisma.metadata_indicateurs_hidden.update({
            where,
            data: original.hidden,
          });
          await prisma.metadata_parametrage_indicateurs.update({
            where,
            data: original.parametrage,
          });
          await prisma.metadata_indicateurs_complementaire.update({
            where,
            data: original.complementaire,
          });
          break;
        }
        case "CHANTIER_PARAMETRAGE_UPDATED": {
          const original = action.filters as metadata_chantiers;
          await prisma.metadata_chantiers.update({
            where: { chantier_id: original.chantier_id },
            data: original,
          });
          break;
        }
        case "TOKEN_API_CREATED":
          await prisma.token_api_information.deleteMany({
            where: { email: action.filters.email as string },
          });
          break;
        case "UTILISATEUR_DEACTIVATED":
          await prisma.utilisateur.updateMany({
            where: action.filters,
            data: { date_desactivation: null },
          });
          break;
        case "PROFIL_UTILISATEUR_UPDATED":
          await prisma.utilisateur.updateMany({
            where: { email: action.filters.email as string },
            data: action.filters.originalData as Record<string, unknown>,
          });
          break;
        case "ALBERT_ACCESS_PROFIL_ENABLED":
          await prisma.albert_access_profil.deleteMany({
            where: { profil_code: action.filters.profilCode as string },
          });
          break;
        case "ALBERT_ACCESS_UTILISATEUR_ADDED":
          await prisma.albert_access_utilisateur.deleteMany({
            where: { utilisateur: { email: action.filters.email as string } },
          });
          break;
      }
    }
    this.actions.length = 0;
    await prisma.$disconnect();
  }
}
