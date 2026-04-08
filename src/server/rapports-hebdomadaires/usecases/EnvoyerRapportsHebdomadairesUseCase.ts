import { $Enums } from "@prisma/client";
import logger from "@/server/infrastructure/Logger";
import type { Inject } from "@/server/rapports-hebdomadaires/module";
import {
  marquerCommeEchec,
  marquerCommeEnvoye,
  RapportHebdomadaire,
} from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";

type EnvoyerRapportResult = {
  emailsEnvoyes: number;
  emailsEnEchec: number;
  erreursDetails: { email: string; erreur: string }[];
};

export class EnvoyerRapportsHebdomadairesUseCase {
  constructor(
    private readonly deps: Inject<"rapportRepository" | "envoieEmailService">,
  ) {}

  async run(params: { dateCreationMin?: Date }): Promise<EnvoyerRapportResult> {
    logger.info(
      { categorie: "rapport", source: "EnvoyerRapportsHebdomadairesUseCase" },
      "Phase 2 démarrée",
    );

    const rapportsAEnvoyer =
      await this.deps.rapportRepository.recupererRapportsParStatut(
        $Enums.statut_envoi_rapport.CREE,
        params.dateCreationMin,
      );

    logger.info(
      {
        categorie: "rapport",
        source: "EnvoyerRapportsHebdomadairesUseCase",
        nombreRapports: rapportsAEnvoyer.length,
      },
      "Rapports à envoyer récupérés",
    );

    let emailsEnvoyes = 0;
    let emailsEnEchec = 0;
    const erreursDetails: { email: string; erreur: string }[] = [];

    for (const rapport of rapportsAEnvoyer) {
      const result = await this.envoyerRapport(rapport);
      if (result.success) {
        emailsEnvoyes++;
      } else {
        emailsEnEchec++;
        erreursDetails.push({
          email: rapport.coordinateur.email,
          erreur: result.erreur!,
        });
      }
    }

    logger.info(
      {
        categorie: "rapport",
        source: "EnvoyerRapportsHebdomadairesUseCase",
        emailsEnvoyes,
        emailsEnEchec,
      },
      "Phase 2 terminée",
    );

    return {
      emailsEnvoyes,
      emailsEnEchec,
      erreursDetails,
    };
  }

  private async envoyerRapport(
    rapport: RapportHebdomadaire,
  ): Promise<{ success: boolean; erreur?: string }> {
    const maintenant = new Date();

    try {
      await this.deps.envoieEmailService.envoyerRapportHebdomadaire({
        rapport,
      });

      const rapportEnvoye = marquerCommeEnvoye({
        rapport,
        dateEnvoi: maintenant,
      });

      await this.deps.rapportRepository.sauvegarder(rapportEnvoye);

      logger.info(
        {
          categorie: "rapport",
          source: "EnvoyerRapportsHebdomadairesUseCase",
          rapportId: rapport.id,
          coordinateurEmail: rapport.coordinateur.email,
        },
        "Email envoyé",
      );

      return { success: true };
    } catch (error) {
      const messageErreur =
        error instanceof Error ? error.message : String(error);

      logger.error(
        {
          categorie: "rapport",
          source: "EnvoyerRapportsHebdomadairesUseCase",
          rapportId: rapport.id,
          coordinateurEmail: rapport.coordinateur.email,
          erreur: messageErreur,
          nombreTentatives: rapport.nombreTentatives + 1,
        },
        "Échec envoi email",
      );

      const rapportEnEchec = marquerCommeEchec({
        rapport,
        erreur: messageErreur,
        dateTentative: maintenant,
      });

      await this.deps.rapportRepository.sauvegarder(rapportEnEchec);

      return { success: false, erreur: messageErreur };
    }
  }
}
