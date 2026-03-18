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

type ActionType =
  | "PROPOSITION_VALEUR_AVANCEMENT_CREEE"
  | "EVENEMENT_PROPOSITION_VALEUR_CREE"
  | "COMMENTAIRE_CREE"
  | "MESURE_INDICATEUR_IMPORTEE"
  | "RAPPORT_IMPORT_CREE"
  | "UTILISATEUR_DESACTIVE";

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
        case "EVENEMENT_PROPOSITION_VALEUR_CREE":
          await prisma.indicateur_territoire_valeur_evenement.deleteMany({
            where: {
              ...action.filters,
              type_evenement: { in: PROPOSITION_VALEUR_EVENEMENTS },
            },
          });
          break;
        case "PROPOSITION_VALEUR_AVANCEMENT_CREEE":
          await prisma.proposition_valeur_actuelle.deleteMany({
            where: action.filters,
          });
          break;
        case "COMMENTAIRE_CREE":
          await prisma.commentaire.deleteMany({
            where: action.filters,
          });
          break;
        case "MESURE_INDICATEUR_IMPORTEE":
          await prisma.mesure_indicateur.deleteMany({
            where: action.filters,
          });
          break;
        case "RAPPORT_IMPORT_CREE": {
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
        case "UTILISATEUR_DESACTIVE":
          await prisma.utilisateur.updateMany({
            where: action.filters,
            data: { date_desactivation: null },
          });
          break;
      }
    }
    this.actions.length = 0;
    await prisma.$disconnect();
  }
}
