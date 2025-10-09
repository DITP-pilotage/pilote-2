import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export class AccesFicheEvaluationService {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async peutAccederFicheAutoEvaluation({
    utilisateurId,
    ficheEvaluationId,
  }: {
    utilisateurId: string;
    ficheEvaluationId: string;
  }): Promise<boolean> {
    const resultat = await this.dependencies.prisma
      .getInstance()
      .fiche_evaluation.count({
        where: {
          id: ficheEvaluationId,
          rattachement: {
            rattachement_utilisateur_etape_jalon: {
              some: {
                etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                utilisateur_id: utilisateurId,
              },
            },
          },
        },
      });

    return resultat != 0;
  }
}
