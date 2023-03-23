import { ReportValidata } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';

export type ValidataValidationFichierPayload = {
  formDataBody: FormData,
  contentType: string
};

export interface HttpClient {
  post(body: ValidataValidationFichierPayload): Promise<ReportValidata>
}
