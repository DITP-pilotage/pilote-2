import logger from "@/server/infrastructure/Logger";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { RapportPropositionsAvancementRepository } from "@/server/chantiers/domain/ports/RapportPropositionsAvancementRepository";
import {
  creerRapportPropositionsAvancement,
  ContenuRapport,
} from "@/server/chantiers/domain/RapportPropositionsAvancement";
import { Utilisateur } from "@/server/chantiers/domain/Utilisateur";
import { RapportDirecteurProjetChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { PropositionValeurAvancementRapport } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";

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
        const contenuRapport = this.genererContenuRapport(
          directeur,
          mapChantiersPropositionInformation,
          propositionsParChantier,
          indicateursNonAJourParChantier,
        );

        if (this.rapportEstVide(contenuRapport)) {
          continue;
        }

        const rapport = creerRapportPropositionsAvancement({
          utilisateurId: directeur.id,
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

  private genererContenuRapport(
    directeur: Utilisateur,
    mapChantiersInfo: Map<string, RapportDirecteurProjetChantierInformation>,
    propositionsParChantier: Map<
      string,
      Map<string, PropositionValeurAvancementRapport[]>
    >,
    indicateursNonAJourParChantier: Map<
      string,
      { id: string; nom: string; mailles: string[] }[]
    >,
  ): ContenuRapport {
    const chantiersAvecPropositions: ContenuRapport["chantiersAvecPropositions"] =
      [];
    const chantiersAvecIndicateursNonAJour: ContenuRapport["chantiersAvecIndicateursNonAJour"] =
      [];

    for (const chantierId of directeur.listeChantiers) {
      const chantierInfo = mapChantiersInfo.get(chantierId);
      if (!chantierInfo) {
        continue;
      }

      const propositionsChantier = propositionsParChantier.get(chantierId);
      if (propositionsChantier && propositionsChantier.size > 0) {
        let nombrePropositions = 0;
        for (const propositions of propositionsChantier.values()) {
          nombrePropositions += propositions.length;
        }
        chantiersAvecPropositions.push({
          chantierId,
          chantierNom: chantierInfo.nom,
          nombrePropositions,
        });
      }

      const indicateursNonAJour =
        indicateursNonAJourParChantier.get(chantierId);
      if (indicateursNonAJour && indicateursNonAJour.length > 0) {
        chantiersAvecIndicateursNonAJour.push({
          chantierId,
          chantierNom: chantierInfo.nom,
          indicateurs: indicateursNonAJour.map((ind) => ({
            id: ind.id,
            nom: ind.nom,
          })),
        });
      }
    }

    return {
      chantiersAvecPropositions,
      chantiersAvecIndicateursNonAJour,
    };
  }

  private rapportEstVide(contenuRapport: ContenuRapport): boolean {
    return (
      contenuRapport.chantiersAvecPropositions.length === 0 &&
      contenuRapport.chantiersAvecIndicateursNonAJour.length === 0
    );
  }
}
