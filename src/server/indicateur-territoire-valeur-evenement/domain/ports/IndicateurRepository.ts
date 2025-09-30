export interface IndicateurRepository {
  supprimerTauxAvancementProposition(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<void>;
  getDateEffectiveValeurAvancement(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<Date | null>;
}
