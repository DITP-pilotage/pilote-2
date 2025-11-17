export interface IndicateurRepository {
  supprimerTauxAvancementProposition(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<void>;
  getDateEffectiveValeurAvancement(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<Date | null>;
  recupererInformationIndicateur(indicId: string): Promise<{
    nom: string;
    chantierId: string;
    chantierNom: string;
  } | null>;
}
