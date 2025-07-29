import FormData from "form-data";
import {
  ReportResourceData,
  ReportValidata,
  ReportValidataWithData,
} from "@/server/import-indicateur/infrastructure/ReportValidata.interface";
import {
  recupererFichier,
  supprimerLeFichier,
} from "@/server/import-indicateur/infrastructure/adapters/FichierService";
import logger from "@/server/infrastructure/Logger";
import {
  HttpClient,
  ValidataValidationFichierPayload,
} from "@/server/import-indicateur/domain/ports/HttpClient.interface";
import { configuration } from "@/config";

export class FetchHttpClient implements HttpClient {
  async post(
    body: ValidataValidationFichierPayload,
  ): Promise<ReportValidataWithData> {
    const formData = new FormData();
    formData.append(
      "file",
      recupererFichier(body.cheminCompletDuFichier),
      body.nomDuFichier,
    );
    formData.append("schema", body.schema);
    formData.append("include_resource_data", "true");

    logger.info(`Soumission du fichier ${body.nomDuFichier} à validata`);

    const result = await new Promise<{
      report: ReportValidata;
      resource_data: ReportResourceData;
    }>(async (resolve) => {
      return formData.submit(
        configuration.import.urlValidata,
        (error, response) => {
          let data = "";
          response.on("data", function (chunk) {
            data += chunk;
          });
          response.on("end", function () {
            resolve(
              JSON.parse(data) as Promise<{
                report: ReportValidata;
                resource_data: ReportResourceData;
              }>,
            );
          });
        },
      );
    })
      .catch((error: Error) => {
        logger.error(`Erreur: ${error.stack}`);
        throw error;
      })
      .finally(() => supprimerLeFichier(body.cheminCompletDuFichier));

    if (!result) {
      throw new Error(
        "Une erreur est survenue lors de l'envoie à la vérification Validata",
      );
    }

    logger.info("Validation du fichier par validata");

    return {
      ...result.report,
      resource_data: result.resource_data,
    };
  }
}
