import logger from "@/server/infrastructure/Logger";
import {
  marquerRapportResponsableCommeEnvoye,
  marquerRapportResponsableCommeEchec,
} from "@/server/chantiers/domain/RapportResponsableDonnees";
import type { Inject } from "@/server/chantiers/module";

export interface EnvoyerLesRapportsResponsablesDonneesResultat {
  rapportsEnvoyes: number;
  rapportsEnEchec: number;
  emailsEnEchec: string[];
}

const TEMPLATE_ID_RAPPORT_PROPOSITIONS = 4;

export class EnvoyerLesRapportsResponsablesDonneesUseCase {
  constructor(
    private readonly dependencies: Inject<
      "rapportResponsableDonneesRepository" | "envoieEmailService"
    >,
  ) {}

  async run(): Promise<EnvoyerLesRapportsResponsablesDonneesResultat> {
    const rapports =
      await this.dependencies.rapportResponsableDonneesRepository.recupererRapportsParStatut(
        "CREE",
      );

    let rapportsEnvoyes = 0;
    let rapportsEnEchec = 0;
    const emailsEnEchec: string[] = [];

    for (const rapport of rapports) {
      const email = rapport.emailResponsable;

      try {
        const { chantiers, conseillerEmail, texteIntro } =
          rapport.contenuRapport;

        await this.dependencies.envoieEmailService.envoieUnEmail(
          [{ email }],
          TEMPLATE_ID_RAPPORT_PROPOSITIONS,
          { chantiers, conseiller_email: conseillerEmail, texteIntro },
        );

        const rapportEnvoye = marquerRapportResponsableCommeEnvoye({
          rapport,
          dateEnvoi: new Date(),
        });

        await this.dependencies.rapportResponsableDonneesRepository.sauvegarder(
          rapportEnvoye,
        );
        rapportsEnvoyes++;
      } catch (error) {
        logger.error(
          {
            categorie: "responsables-donnees",
            source: "EnvoyerLesRapportsResponsablesDonneesUseCase",
            email,
          },
          `Erreur envoi rapport : ${(error as Error).message}`,
        );

        const rapportEnEchec = marquerRapportResponsableCommeEchec({
          rapport,
          dateTentative: new Date(),
          erreur: error instanceof Error ? error.message : String(error),
        });

        await this.dependencies.rapportResponsableDonneesRepository.sauvegarder(
          rapportEnEchec,
        );
        rapportsEnEchec++;
        emailsEnEchec.push(email);
      }
    }

    return { rapportsEnvoyes, rapportsEnEchec, emailsEnEchec };
  }
}
