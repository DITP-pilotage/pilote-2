import { HttpClient, ValidataValidationFichierPayload } from '@/server/import-indicateur/domain/ports/HttpClient';
import { ReportValidata } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';

export class FetchHttpClient implements HttpClient {
  async post(body: ValidataValidationFichierPayload): Promise<ReportValidata> {
    const { report }: { report: ReportValidata } = await fetch('https://api.validata.etalab.studio/validate', {
      method: 'post',
      body: body.formDataBody,
      headers: {
        'content-type': body.contentType,
      },
    }).then(response =>
      response.json(),
    );
    
    return report;
  }
}
