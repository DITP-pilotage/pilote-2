import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';

export type ValiderFichierPayload = {
  cheminCompletDuFichier: string
  nomDuFichier: string
  schema: string
};
export interface FichierIndicateurValidationService {
  validerFichier({ cheminCompletDuFichier, nomDuFichier, schema }: ValiderFichierPayload): Promise<DetailValidationFichier>;
}
