import logger from "@/server/infrastructure/Logger";
import { RapportRepository } from "@/server/rapports-hebdomadaires/domain/ports/RapportRepository";
import { EnvoieEmailService } from "@/server/rapports-hebdomadaires/domain/ports/EnvoieEmailService";
import { StatutEnvoi } from "@/server/rapports-hebdomadaires/domain/StatutEnvoi";
import {
  marquerCommeEnvoye,
  marquerCommeEchec,
  RapportHebdomadaire,
} from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";

type EnvoyerRapportResult = {
  emailsEnvoyés: number;
  emailsEnEchec: number;
  erreursDetails: { email: string; erreur: string }[];
};

interface Dependencies {
  rapportRepository: RapportRepository;
  envoieEmailService: EnvoieEmailService;
}

export class EnvoyerRapportsHebdomadairesUseCase {
  constructor(private readonly deps: Dependencies) {}

  async run(params: { dateCreationMin?: Date }): Promise<EnvoyerRapportResult> {
    logger.info("Phase 2 démarrée");

    const rapportsAEnvoyer =
      await this.deps.rapportRepository.recupererRapportsParStatut({
        statut: StatutEnvoi.CREE,
        dateCreationMin: params.dateCreationMin,
      });

    logger.info("Rapports à envoyer récupérés", {
      nombreRapports: rapportsAEnvoyer.length,
    });

    let emailsEnvoyés = 0;
    let emailsEnEchec = 0;
    const erreursDetails: { email: string; erreur: string }[] = [];

    for (const rapport of rapportsAEnvoyer) {
      const result = await this.envoyerRapport(rapport);
      if (result.success) {
        emailsEnvoyés++;
      } else {
        emailsEnEchec++;
        erreursDetails.push({
          email: rapport.coordinateur.email,
          erreur: result.erreur!,
        });
      }
    }

    logger.info("Phase 2 terminée", {
      emailsEnvoyés,
      emailsEnEchec,
    });

    return {
      emailsEnvoyés,
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

      await this.deps.rapportRepository.mettreAJour({ rapport: rapportEnvoye });

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

      await this.deps.rapportRepository.mettreAJour({
        rapport: rapportEnEchec,
      });

      return { success: false, erreur: messageErreur };
    }
  }
}
