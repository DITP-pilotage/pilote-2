import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';

export type ValiderFichierPayload = {
  cheminCompletDuFichier: string
  nomDuFichier: string
  schema: string
  utilisateurEmail: string
};
export interface FichierIndicateurValidationService {
  validerFichier(payload: ValiderFichierPayload): Promise<DetailValidationFichier>;
}
