export interface RapportRepository {
  anonymiserAuteurs(auteursAAnonymiserEmails: string[], emailAuteurRemplacement: string): Promise<void>;
}
