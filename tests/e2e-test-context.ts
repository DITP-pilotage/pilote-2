import { $Enums, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

type EntityType =
  | "pva"
  | "evenement"
  | "commentaire"
  | "mesure_indicateur"
  | "rapport_import"
  | "utilisateur_reactivation";

interface TrackedEntity {
  type: EntityType;
  filters: Record<string, unknown>;
}

export class E2ETestContext {
  private readonly entities: TrackedEntity[] = [];

  track(type: EntityType, filters: Record<string, unknown>): void {
    this.entities.push({ type, filters });
  }

  async cleanup(): Promise<void> {
    for (const entity of this.entities) {
      switch (entity.type) {
        case "evenement":
          await prisma.indicateur_territoire_valeur_evenement.deleteMany({
            where: {
              ...entity.filters,
              type_evenement: { in: PROPOSITION_VALEUR_EVENEMENTS },
            },
          });
          break;
        case "pva":
          await prisma.proposition_valeur_actuelle.deleteMany({
            where: entity.filters,
          });
          break;
        case "commentaire":
          await prisma.commentaire.deleteMany({
            where: entity.filters,
          });
          break;
        case "mesure_indicateur":
          await prisma.mesure_indicateur.deleteMany({
            where: entity.filters,
          });
          break;
        case "rapport_import": {
          const rapports =
            await prisma.rapport_import_mesure_indicateur.findMany({
              where: entity.filters,
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
        case "utilisateur_reactivation":
          await prisma.utilisateur.updateMany({
            where: entity.filters,
            data: { date_desactivation: null },
          });
          break;
      }
    }
    this.entities.length = 0;
  }
}
