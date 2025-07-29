export interface DecisionStrategiqueRepository {
  anonymiserAuteurs(
    listeIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void>;
}
