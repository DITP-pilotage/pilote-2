import { ReportValidata } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';

export type ValidataValidationFichierPayload = {
  cheminCompletDuFichier: string
  nomDuFichier: string
  schema: string
};

export interface HttpClient {
  post(body: ValidataValidationFichierPayload): Promise<ReportValidata>
}
