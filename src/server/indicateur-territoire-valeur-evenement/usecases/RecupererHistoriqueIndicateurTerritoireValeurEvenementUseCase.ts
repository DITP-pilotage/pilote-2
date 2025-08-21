import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export type HistoriqueIndicateurTerritoireValeurEvenement = {
  [dateValeur: string]: IndicateurTerritoireValeurEvenement[];
};

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
  }): Promise<HistoriqueIndicateurTerritoireValeurEvenement> {
    const evenements =
      await this._indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode(
        args,
      );

    const historiqueGroupe: HistoriqueIndicateurTerritoireValeurEvenement = {};

    evenements.forEach((evenement) => {
      const dateKey = evenement.dateValeur.toISOString();

      if (!historiqueGroupe[dateKey]) {
        historiqueGroupe[dateKey] = [];
      }

      historiqueGroupe[dateKey].push(evenement);
    });

    const historiqueTrie: HistoriqueIndicateurTerritoireValeurEvenement = {};
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
