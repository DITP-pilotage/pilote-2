import logger from "@/server/infrastructure/Logger";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { RapportPropositionsAvancementRepository } from "@/server/chantiers/domain/ports/RapportPropositionsAvancementRepository";
import { creerRapportPropositionsAvancement } from "@/server/chantiers/domain/RapportPropositionsAvancement";
import { genererParametresEnvoieRapportProposition } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition";

interface Dependencies {
  chantierRepository: ChantierRepository;
  utilisateurRepository: UtilisateurRepository;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  indicateurRepository: IndicateurRepository;
  rapportPropositionsAvancementRepository: RapportPropositionsAvancementRepository;
}

export interface CreerLesRapportsPropositionsResultat {
  rapportsCrees: number;
  erreursCreation: number;
}

export class CreerLesRapportsPropositionsUseCase {
  constructor(private readonly dependencies: Dependencies) {}

  async run(): Promise<CreerLesRapportsPropositionsResultat> {
    const propositionsParChantier =
      await this.dependencies.indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds();

    const indicateursNonAJourParChantier =
      await this.dependencies.indicateurRepository.recupererIndicateursNonAJourParChantierId();

    const listeChantiersIdsRapport = [
      ...new Set([
        ...propositionsParChantier.keys(),
        ...indicateursNonAJourParChantier.keys(),
      ]),
    ];

    const listeDirecteursDeProjet =
      await this.dependencies.utilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
        "EQUIPE_DIR_PROJET",
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

    for (const directeur of listeDirecteursDeProjet) {
      try {
        if (
          !this.directeurADesChantiersConcernes(
            directeur.listeChantiers,
            propositionsParChantier,
            indicateursNonAJourParChantier,
          )
        ) {
          continue;
        }

        const contenuRapport = genererParametresEnvoieRapportProposition(
          directeur.listeChantiers,
          mapChantiersPropositionInformation,
          propositionsParChantier,
          indicateursNonAJourParChantier,
        );

        const rapport = creerRapportPropositionsAvancement({
          utilisateur: {
            id: directeur.id,
            email: directeur.email,
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
          `Erreur lors de la création du rapport pour ${directeur.email}:`,
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
  ): boolean {
    return listeChantiers.some(
      (chantierId) =>
        propositionsParChantier.has(chantierId) ||
        indicateursNonAJourParChantier.has(chantierId),
    );
  }
}
