import logger from "@/server/infrastructure/Logger";
import { creerRapportResponsableDonnees } from "@/server/chantiers/domain/RapportResponsableDonnees";
import { genererParametresRapportResponsableDonnees } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition";
import type { Inject } from "@/server/chantiers/module";

const CHANTIER_ID_CH197 = "CH-197";

export interface CreerLesRapportsResponsablesDonneesResultat {
  rapportsCrees: number;
  erreursCreation: number;
}

export class CreerLesRapportsResponsablesDonneesUseCase {
  constructor(
    private readonly dependencies: Inject<
      | "chantierRepository"
      | "indicateurRepository"
      | "rapportResponsableDonneesRepository"
    >,
  ) {}

  async run(): Promise<CreerLesRapportsResponsablesDonneesResultat> {
    const indicateurs =
      await this.dependencies.indicateurRepository.recupererIndicateursNonAJourAvecResponsablesDonneesPourChantierId(
        CHANTIER_ID_CH197,
      );

    if (indicateurs.length === 0) {
      return { rapportsCrees: 0, erreursCreation: 0 };
    }

    const [chantierInfo] =
      await this.dependencies.chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds(
        { listeChantiersIds: [CHANTIER_ID_CH197] },
      );

    if (!chantierInfo) {
      logger.warn(
        { categorie: "responsables-donnees", chantierId: CHANTIER_ID_CH197 },
        "Chantier CH-197 introuvable, arrêt de la création des rapports",
      );
      return { rapportsCrees: 0, erreursCreation: 0 };
    }

    const indicateursParResponsable = new Map<
      string,
      { id: string; nom: string; mailles: string[] }[]
    >();

    for (const indicateur of indicateurs) {
      if (indicateur.responsablesDonneesMails.length === 0) {
        logger.warn(
          {
            categorie: "responsables-donnees",
            indicateurId: indicateur.id,
          },
          "Indicateur non à jour sans responsable de données, ignoré",
        );
        continue;
      }

      for (const email of indicateur.responsablesDonneesMails) {
        if (!indicateursParResponsable.has(email)) {
          indicateursParResponsable.set(email, []);
        }
        indicateursParResponsable.get(email)!.push({
          id: indicateur.id,
          nom: indicateur.nom,
          mailles: indicateur.mailles,
        });
      }
    }

    let rapportsCrees = 0;
    let erreursCreation = 0;

    for (const [
      emailResponsable,
      indicateursResponsable,
    ] of indicateursParResponsable) {
      try {
        const contenuRapport = genererParametresRapportResponsableDonnees(
          chantierInfo,
          indicateursResponsable,
        );

        const rapport = creerRapportResponsableDonnees({
          emailResponsable,
          contenuRapport,
          dateCreation: new Date(),
        });

        await this.dependencies.rapportResponsableDonneesRepository.sauvegarder(
          rapport,
        );
        rapportsCrees++;
      } catch (error) {
        logger.error(
          {
            categorie: "responsables-donnees",
            source: "CreerLesRapportsResponsablesDonneesUseCase",
            email: emailResponsable,
          },
          `Erreur création rapport : ${(error as Error).message}`,
        );
        erreursCreation++;
      }
    }

    return { rapportsCrees, erreursCreation };
  }
}
