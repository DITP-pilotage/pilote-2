import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';

export interface ErreurValidationFichierRepository {
  sauvegarder(listeErreursValidationFichier: ErreurValidationFichier[]): Promise<void>;
}
