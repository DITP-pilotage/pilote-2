export interface ObjectifRepository {
  anonymiserAuteurs(listeIds: string[], emailAuteurRemplacement: string): Promise<void>;
}
