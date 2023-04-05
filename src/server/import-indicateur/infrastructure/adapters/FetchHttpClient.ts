import FormData from 'form-data';
import * as fs from 'node:fs';
import { HttpClient, ValidataValidationFichierPayload } from '@/server/import-indicateur/domain/ports/HttpClient';
import { ReportValidata } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';

export class FetchHttpClient implements HttpClient {
  private readonly urlValidata = 'https://api.validata.etalab.studio/validate';

  async post(body: ValidataValidationFichierPayload): Promise<ReportValidata> {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(body.cheminCompletDuFichier), body.nomDuFichier);
    formData.append('schema', body.schema);


    const { report } = await new Promise<{ report: ReportValidata }>(async (resolve) => {
      await formData.submit(this.urlValidata, (error, response) => {
        let data = '';
        response.on('data', function (chunk) {
          data += chunk;
        });
        response.on('end', function () {
          resolve(JSON.parse(data) as Promise<any>);
        });
      });
    }).finally(() => fs.unlink(body.cheminCompletDuFichier, () => {}));

    return report;
  }
}
