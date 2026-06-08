export type EvenementValeurDelta = {
  indicId: string;
  territoire_code: string;
  dateValeur: Date;
  valeur: number | null;
};

export interface IndicateurTerritoireValeurEvenementRepository {
  recupererEvenementsModifiesDepuis(args: {
    indicId: string;
    dateMin: Date;
  }): Promise<EvenementValeurDelta[]>;
}
