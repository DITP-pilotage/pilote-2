import logger from "@/server/infrastructure/Logger";
import { creerRapportPropositionsAvancement } from "@/server/chantiers/domain/RapportPropositionsAvancement";
import { genererParametresEnvoieRapportProposition } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";
import type { Inject } from "@/server/chantiers/module";

export interface CreerLesRapportsPropositionsResultat {
  rapportsCrees: number;
  erreursCreation: number;
}

export class CreerLesRapportsPropositionsUseCase {
  constructor(
    private readonly dependencies: Inject<
      | "chantierRepository"
      | "utilisateurRepository"
      | "indicateurTerritoireValeurEvenementRepository"
      | "indicateurRepository"
      | "rapportPropositionsAvancementRepository"
    >,
  ) {}

  async run(): Promise<CreerLesRapportsPropositionsResultat> {
    const propositionsParChantier =
      await this.dependencies.indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds();

    const indicateursNonAJourParChantier =
      await this.dependencies.indicateurRepository.recupererIndicateursNonAJourParChantierId();

    const jalon = getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );
    const indicateursAParametrerParChantier =
      await this.dependencies.indicateurRepository.recupererIndicateursAParametrerParChantierId(
        jalon,
      );

    const listeChantiersIdsRapport = [
      ...new Set([
        ...propositionsParChantier.keys(),
        ...indicateursNonAJourParChantier.keys(),
        ...indicateursAParametrerParChantier.keys(),
      ]),
    ];

    const listeDestinatairesRapport =
      await this.dependencies.utilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
        ["EQUIPE_DIR_PROJET", "SECRETARIAT_GENERAL"],
        listeChantiersIdsRapport,
      );

    const listeChantiersProposition =
      await this.dependencies.chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds(
        { listeChantiersIds: listeChantiersIdsRapport },
      );

    const mapChantiersPropositionInformation = new Map(
      listeChantiersProposition.map((chantier) => [chantier.id, chantier]),
    );

    let rapportsCrees = 0;
    let erreursCreation = 0;

    for (const destinataire of listeDestinatairesRapport) {
      try {
        if (
          !this.directeurADesChantiersConcernes(
            destinataire.listeChantiers,
            propositionsParChantier,
            indicateursNonAJourParChantier,
            indicateursAParametrerParChantier,
          )
        ) {
          continue;
        }

        const contenuRapport = genererParametresEnvoieRapportProposition(
          destinataire.listeChantiers,
          mapChantiersPropositionInformation,
          propositionsParChantier,
          indicateursNonAJourParChantier,
          indicateursAParametrerParChantier,
        );

        const rapport = creerRapportPropositionsAvancement({
          utilisateur: {
            id: destinataire.id,
            email: destinataire.email,
          },
          contenuRapport,
          dateCreation: new Date(),
        });

        await this.dependencies.rapportPropositionsAvancementRepository.sauvegarder(
          rapport,
        );
        rapportsCrees++;
      } catch (error) {
        logger.error(
          `Erreur lors de la création du rapport pour ${destinataire.email}:`,
          error,
        );
        erreursCreation++;
      }
    }

    return { rapportsCrees, erreursCreation };
  }

  private directeurADesChantiersConcernes(
    listeChantiers: string[],
    propositionsParChantier: Map<string, unknown>,
    indicateursNonAJourParChantier: Map<string, unknown>,
    indicateursAParametrerParChantier: Map<string, unknown>,
  ): boolean {
    return listeChantiers.some(
      (chantierId) =>
        propositionsParChantier.has(chantierId) ||
        indicateursNonAJourParChantier.has(chantierId) ||
        indicateursAParametrerParChantier.has(chantierId),
    );
  }
}
