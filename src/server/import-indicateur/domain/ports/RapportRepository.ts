import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';

export interface RapportRepository {
  sauvegarder(rapport: DetailValidationFichier): Promise<void>;

  récupérerRapportParId(rapportId: string): Promise<DetailValidationFichier>;
}
