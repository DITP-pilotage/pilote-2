import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';

export interface FichierIndicateurValidationService {
  validerFichier(formDataBody: FormData, contentType: string): Promise<DetailValidationFichier>;
}
