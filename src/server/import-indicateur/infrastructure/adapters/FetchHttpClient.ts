import FormData from 'form-data';
import { HttpClient, ValidataValidationFichierPayload } from '@/server/import-indicateur/domain/ports/HttpClient';
import { ReportValidata } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';
import {
  recupererFichier,
  supprimerLeFichier,
} from '@/server/import-indicateur/infrastructure/adapters/FichierService';
import logger from '@/server/infrastructure/logger';

export class FetchHttpClient implements HttpClient {
  private readonly urlValidata = 'https://api.validata.etalab.studio/validate';

  async post(body: ValidataValidationFichierPayload): Promise<ReportValidata> {
    const formData = new FormData();
    formData.append('file', recupererFichier(body.cheminCompletDuFichier), body.nomDuFichier);
    formData.append('schema', body.schema);

    logger.info(`Soumission du fichier ${body.nomDuFichier} à validata`);
    
    const { report } = await new Promise<{ report: ReportValidata }>(async (resolve) => {
      await formData.submit(this.urlValidata, (error, response) => {
        let data = '';
        response.on('data', function (chunk) {
          data += chunk;
        });
        response.on('end', function () {
          resolve(JSON.parse(data) as Promise<{ report: ReportValidata }>);
        });
      });
    }).catch((error: Error) => {
      logger.error(`Erreur: ${error.stack}`);
      throw error;
    }).finally(() => supprimerLeFichier(body.cheminCompletDuFichier));

    logger.info('Validation du fichier par validata');

    return report;
  }
}
