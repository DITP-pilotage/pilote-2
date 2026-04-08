import logger from "@/server/infrastructure/Logger";
import {
  marquerRapportCommeEnvoye,
  marquerRapportCommeEchec,
} from "@/server/chantiers/domain/RapportPropositionsAvancement";
import type { Inject } from "@/server/chantiers/module";

export interface EnvoyerLesRapportsPropositionsResultat {
  rapportsEnvoyes: number;
  rapportsEnEchec: number;
  emailsEnEchec: string[];
}

const TEMPLATE_ID_RAPPORT_PROPOSITIONS = 4;

export class EnvoyerLesRapportsPropositionsUseCase {
  constructor(
    private readonly dependencies: Inject<
      "rapportPropositionsAvancementRepository" | "envoieEmailService"
    >,
  ) {}

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
        logger.error(
          {
            categorie: "pva",
            source: "EnvoyerLesRapportsPropositionsUseCase",
            email,
          },
          `Erreur envoi rapport : ${(error as Error).message}`,
        );

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
