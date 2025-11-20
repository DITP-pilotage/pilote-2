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

  async peutAccederEtapeAppreciation({
    utilisateurId,
  }: {
    utilisateurId: string;
  }): Promise<boolean> {
    return this.peutAccederEtape(
      utilisateurId,
      $Enums.etape_evaluation_enum.CONSOLIDATION,
    );
  }

  async peutAccederEtapeInstruction({
    utilisateurId,
  }: {
    utilisateurId: string;
  }): Promise<boolean> {
    return this.peutAccederEtape(
      utilisateurId,
      $Enums.etape_evaluation_enum.INSTRUCTION,
    );
  }

  async peutAccederEtapePilotage({
    applicationsAccessibles,
  }: {
    applicationsAccessibles: $Enums.application_accessible[];
  }): Promise<boolean> {
    return applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
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

    return resultat !== 0;
  }

  private async peutAccederEtape(
    utilisateurId: string,
    etape: $Enums.etape_evaluation_enum,
  ) {
    const resultat = await this.dependencies.prisma
      .getInstance()
      .rattachement_utilisateur_etape_jalon.count({
        where: {
          etape,
          utilisateur_id: utilisateurId,
        },
      });

    return resultat != 0;
  }
}
