export interface IndicateurTerritoireValeurEvenementRepository {
  anonymiserAuteurs(
    listeIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void>;
}
