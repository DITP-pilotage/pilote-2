export interface IndicateurRepository {
  supprimerTauxAvancementProposition(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<void>;
}
