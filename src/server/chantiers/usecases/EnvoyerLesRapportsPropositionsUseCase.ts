import logger from "@/server/infrastructure/Logger";
import { RapportPropositionsAvancementRepository } from "@/server/chantiers/domain/ports/RapportPropositionsAvancementRepository";
import { EnvoieEmailService } from "@/server/chantiers/domain/ports/EnvoieEmailService";
import {
  marquerRapportCommeEnvoye,
  marquerRapportCommeEchec,
} from "@/server/chantiers/domain/RapportPropositionsAvancement";

interface Dependencies {
  rapportPropositionsAvancementRepository: RapportPropositionsAvancementRepository;
  envoieEmailService: EnvoieEmailService;
}

export interface EnvoyerLesRapportsPropositionsResultat {
  rapportsEnvoyes: number;
  rapportsEnEchec: number;
  emailsEnEchec: string[];
}

const TEMPLATE_ID_RAPPORT_PROPOSITIONS = 4;

export class EnvoyerLesRapportsPropositionsUseCase {
  constructor(private readonly dependencies: Dependencies) {}

  async run(): Promise<EnvoyerLesRapportsPropositionsResultat> {
    const rapports =
      await this.dependencies.rapportPropositionsAvancementRepository.recupererRapportsParStatut(
        "CREE",
      );

    let rapportsEnvoyes = 0;
    let rapportsEnEchec = 0;
    const emailsEnEchec: string[] = [];

    for (const rapport of rapports) {
      const email = rapport.utilisateur.email;

      try {
        const { chantiers, conseillerEmail, texteIntro } =
          rapport.contenuRapport;

        await this.dependencies.envoieEmailService.envoieUnEmail(
          [{ email }],
          TEMPLATE_ID_RAPPORT_PROPOSITIONS,
          { chantiers, conseiller_email: conseillerEmail, texteIntro },
        );

        const rapportEnvoye = marquerRapportCommeEnvoye({
          rapport,
          dateEnvoi: new Date(),
        });

        await this.dependencies.rapportPropositionsAvancementRepository.sauvegarder(
          rapportEnvoye,
        );
        rapportsEnvoyes++;
      } catch (error) {
        logger.error(`Erreur lors de l'envoi du rapport pour ${email}:`, error);

        const rapportEnEchec = marquerRapportCommeEchec({
          rapport,
          dateTentative: new Date(),
          erreur: error instanceof Error ? error.message : String(error),
        });

        await this.dependencies.rapportPropositionsAvancementRepository.sauvegarder(
          rapportEnEchec,
        );
        rapportsEnEchec++;
        emailsEnEchec.push(email);
      }
    }

    return { rapportsEnvoyes, rapportsEnEchec, emailsEnEchec };
  }
}
