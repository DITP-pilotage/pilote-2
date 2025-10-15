import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export class AccesFicheEvaluationService {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async peutAccederEtapeAutoEvaluation({
    utilisateurId,
    ficheEvaluationId,
  }: {
    utilisateurId: string;
    ficheEvaluationId: string;
  }): Promise<boolean> {
    return this.peutAccederEtapePourFiche(
      ficheEvaluationId,
      utilisateurId,
      $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    );
  }

  async peutAccederEtapeConsolidation({
    utilisateurId,
  }: {
    utilisateurId: string;
  }): Promise<boolean> {
    return this.peutAccederEtape(
      utilisateurId,
      $Enums.etape_evaluation_enum.CONSOLIDATION,
    );
  }

  private async peutAccederEtapePourFiche(
    ficheEvaluationId: string,
    utilisateurId: string,
    etape: $Enums.etape_evaluation_enum,
  ) {
    const resultat = await this.dependencies.prisma
      .getInstance()
      .fiche_evaluation.count({
        where: {
          id: ficheEvaluationId,
          rattachement: {
            rattachement_utilisateur_etape_jalon: {
              some: {
                etape,
                utilisateur_id: utilisateurId,
              },
            },
          },
        },
      });

    return resultat != 0;
  }

  private async peutAccederEtape(
    utilisateurId: string,
    etape: $Enums.etape_evaluation_enum,
  ) {
    const resultat = await this.dependencies.prisma
      .getInstance()
      .fiche_evaluation.count({
        where: {
          rattachement: {
            rattachement_utilisateur_etape_jalon: {
              some: {
                etape,
                utilisateur_id: utilisateurId,
              },
            },
          },
        },
      });

    return resultat != 0;
  }
}
