export interface IndicateurRepository {
  supprimerTauxAvancementProposition(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<void>;
  getDerniereDateValeurAvancement(
    indicId: string,
    territoireCode: string,
  ): Promise<Date | null>;
}
