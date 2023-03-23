import { DetailValidationFichier } from '@/server/import-indicateur/domain/detail-validation.fichier';

export interface FichierIndicateurValidationService {
  validerFichier(formDataBody: FormData, contentType: string): Promise<DetailValidationFichier>;
}
