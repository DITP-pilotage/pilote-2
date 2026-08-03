import logger from "@/server/infrastructure/Logger";
import { creerRapportResponsableDonnees } from "@/server/chantiers/domain/RapportResponsableDonnees";
import { genererParametresRapportResponsableDonnees } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportResponsableDonnees";
import type { Inject } from "@/server/chantiers/module";

const CHANTIERS_IDS_CONCERNES = ["CH-197"];

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
    const indicateursParChantier =
      await this.dependencies.indicateurRepository.recupererIndicateursNonAJourParChantierId(
        {
          chantiersIds: CHANTIERS_IDS_CONCERNES,
          inclureChantiersBrouillon: true,
        },
      );

    if (indicateursParChantier.size === 0) {
      return { rapportsCrees: 0, erreursCreation: 0 };
    }

    const chantiersInfos =
      await this.dependencies.chantierRepository.recupererChantierInformationsParIds(
        {
          listeChantiersIds: CHANTIERS_IDS_CONCERNES,
        },
      );
    const mapChantiersInfos = new Map(
      chantiersInfos.map((chantier) => [chantier.id, chantier]),
    );

    let rapportsCrees = 0;
    let erreursCreation = 0;

    for (const [chantierId, indicateurs] of indicateursParChantier) {
      const chantierInfo = mapChantiersInfos.get(chantierId);

      if (!chantierInfo) {
        logger.warn(
          { categorie: "responsables-donnees", chantierId },
          "Chantier introuvable, ignoré",
        );
        continue;
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
    }

    return { rapportsCrees, erreursCreation };
  }
}
