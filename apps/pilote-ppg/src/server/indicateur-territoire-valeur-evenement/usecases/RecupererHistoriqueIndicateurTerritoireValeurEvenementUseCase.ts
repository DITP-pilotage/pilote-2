import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { toISODate } from "@/server/app/domain/Dates";
import { filtrerEvenementsRedondants } from "@/server/indicateur-territoire-valeur-evenement/domain/filtrerEvenementsRedondants";
import type { Inject } from "@/server/indicateur-territoire-valeur-evenement/module";

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
  valeur: number | null;
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
  }: Inject<"indicateurTerritoireValeurEvenementRepository">) {
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

    const evenementsGroupesParDate: Record<
      string,
      IndicateurTerritoireValeurEvenement[]
    > = {};

    evenements.forEach((evenement) => {
      const dateKey = toISODate(evenement.dateValeur);

      if (!evenementsGroupesParDate[dateKey]) {
        evenementsGroupesParDate[dateKey] = [];
      }

      evenementsGroupesParDate[dateKey].push(evenement);
    });

    const historiqueTrie: HistoriqueIndicateurTerritoireValeurEvenementContrat =
      {};

    Object.keys(evenementsGroupesParDate)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach((dateKey) => {
        const evenementsDuJourTriesParOrdreDecroissant =
          evenementsGroupesParDate[dateKey].sort((a, b) => b.ordre - a.ordre);

        historiqueTrie[dateKey] = filtrerEvenementsRedondants(
          evenementsDuJourTriesParOrdreDecroissant,
        ).map(presenterEnIndicateurTerritoireValeurEvenement);
      });

    return historiqueTrie;
  }
}
