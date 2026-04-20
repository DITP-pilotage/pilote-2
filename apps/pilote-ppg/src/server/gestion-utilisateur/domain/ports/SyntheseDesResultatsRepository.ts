export interface SyntheseDesResultatsRepository {
  anonymiserAuteurs(
    auteursAAnonymiserIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void>;
}
