import FormData from 'form-data';
import { ReportValidata } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';
import {
  recupererFichier,
  supprimerLeFichier,
} from '@/server/import-indicateur/infrastructure/adapters/FichierService';
import logger from '@/server/infrastructure/Logger';
import {
  HttpClient,
  ValidataValidationFichierPayload,
} from '@/server/import-indicateur/domain/ports/HttpClient.interface';
import { configuration } from '@/config';

export class FetchHttpClient implements HttpClient {

  async post(body: ValidataValidationFichierPayload): Promise<ReportValidata> {
    const formData = new FormData();
    formData.append('file', recupererFichier(body.cheminCompletDuFichier), body.nomDuFichier);
    formData.append('schema', body.schema);

    logger.info(`Soumission du fichier ${body.nomDuFichier} à validata`);

    const { report } = await new Promise<{ report: ReportValidata }>(async (resolve) => {
      await formData.submit(configuration.import.urlValidata, (error, response) => {
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

    if (!report) {
      throw new Error("Une erreur est survenue lors de l'envoie à la vérification Validata");
    }

    logger.info('Validation du fichier par validata');

    return report;
  }
}
