import { $Enums } from "@prisma/client";
import logger from "@/server/infrastructure/Logger";
import { RapportRepository } from "@/server/rapports-hebdomadaires/domain/ports/RapportRepository";
import { EnvoieEmailService } from "@/server/rapports-hebdomadaires/domain/ports/EnvoieEmailService";
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
    private readonly deps: {
      rapportRepository: RapportRepository;
      envoieEmailService: EnvoieEmailService;
    },
  ) {}

  async run(params: { dateCreationMin?: Date }): Promise<EnvoyerRapportResult> {
    logger.info("Phase 2 démarrée");

    const rapportsAEnvoyer =
      await this.deps.rapportRepository.recupererRapportsParStatut(
        $Enums.statut_envoi_rapport.CREE,
        params.dateCreationMin,
      );

    logger.info("Rapports à envoyer récupérés", {
      nombreRapports: rapportsAEnvoyer.length,
    });

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

    logger.info("Phase 2 terminée", {
      emailsEnvoyes,
      emailsEnEchec,
    });

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

      logger.info("Email envoyé", {
        rapportId: rapport.id,
        coordinateurEmail: rapport.coordinateur.email,
      });

      return { success: true };
    } catch (error) {
      const messageErreur =
        error instanceof Error ? error.message : String(error);

      logger.error("Échec envoi email", {
        rapportId: rapport.id,
        coordinateurEmail: rapport.coordinateur.email,
        erreur: messageErreur,
        nombreTentatives: rapport.nombreTentatives + 1,
      });

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
