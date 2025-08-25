import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export type HistoriqueIndicateurTerritoireValeurEvenementContrat = {
  [dateValeur: string]: IndicateurTerritoireValeurEvenementContrat[];
};

type IndicateurTerritoireValeurEvenementContrat = {
  id: string;
  indicId: string;
  territoireCode: string;
  typeEvenement: string;
  typeValeur: string;
  dateValeur: Date;
  valeur: number;
  donneesComplementaires: IndicateurTerritoireValeurEvenement["donneesComplementaires"];
  idAuteurModification: string;
  correlationId: string;
  ordre: number;
  dateCreation: Date;
};

function presenterEnIndicateurTerritoireValeurEvenement(
  indicateurTerritoireValeurEvenement: IndicateurTerritoireValeurEvenement,
): IndicateurTerritoireValeurEvenementContrat {
  return {
    id: indicateurTerritoireValeurEvenement.id,
    indicId: indicateurTerritoireValeurEvenement.indicId,
    territoireCode: indicateurTerritoireValeurEvenement.territoireCode,
    typeEvenement: indicateurTerritoireValeurEvenement.typeEvenement,
    typeValeur: indicateurTerritoireValeurEvenement.typeValeur,
    dateValeur: indicateurTerritoireValeurEvenement.dateValeur,
    valeur: indicateurTerritoireValeurEvenement.valeur,
    donneesComplementaires:
      indicateurTerritoireValeurEvenement.donneesComplementaires,
    idAuteurModification:
      indicateurTerritoireValeurEvenement.idAuteurModification,
    correlationId: indicateurTerritoireValeurEvenement.correlationId,
    ordre: indicateurTerritoireValeurEvenement.ordre,
    dateCreation: indicateurTerritoireValeurEvenement.dateCreation,
  };
}

export class RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase {
  private _indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
  }: {
    indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  }) {
    this._indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
  }

  async run(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<HistoriqueIndicateurTerritoireValeurEvenementContrat> {
    const evenements =
      await this._indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode(
        args,
      );

    const historiqueGroupe: HistoriqueIndicateurTerritoireValeurEvenementContrat =
      {};

    evenements.forEach((evenement) => {
      const dateKey = evenement.dateValeur.toISOString();

      if (!historiqueGroupe[dateKey]) {
        historiqueGroupe[dateKey] = [];
      }

      historiqueGroupe[dateKey].push(
        presenterEnIndicateurTerritoireValeurEvenement(evenement),
      );
    });

    const historiqueTrie: HistoriqueIndicateurTerritoireValeurEvenementContrat =
      {};

    Object.keys(historiqueGroupe)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach((dateKey) => {
        historiqueTrie[dateKey] = historiqueGroupe[dateKey].sort(
          (a, b) => b.ordre - a.ordre,
        );
      });

    return historiqueTrie;
  }
}
