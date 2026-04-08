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

    logger.info(
      {
        categorie: "import",
        source: "FetchHttpClient",
        nomDuFichier: body.nomDuFichier,
      },
      "Soumission du fichier à Validata",
    );

    const result = await new Promise<{
      report: ReportValidata;
      resource_data: ReportResourceData;
    }>((resolve, reject) => {
      return formData.submit(
        configuration().import.urlValidata,
        (error, response) => {
          if (error) {
            return reject(error);
          }

          let data = "";
          response.on("data", function (chunk) {
            data += chunk;
          });
          response.on("end", function () {
            try {
              resolve(
                JSON.parse(data) as {
                  report: ReportValidata;
                  resource_data: ReportResourceData;
                },
              );
            } catch {
              reject(
                new Error(
                  `Une erreur est survenue lors de la validation du fichier`,
                ),
              );
            }
          });
        },
      );
    })
      .catch((error: Error) => {
        logger.error(
          {
            categorie: "import",
            source: "FetchHttpClient",
            nomDuFichier: body.nomDuFichier,
            errorStack: error.stack,
          },
          "Erreur lors de la validation Validata",
        );
        throw error;
      })
      .finally(() => supprimerLeFichier(body.cheminCompletDuFichier));

    if (!result) {
      throw new Error(
        "Une erreur est survenue lors de l'envoie à la vérification Validata",
      );
    }

    logger.info(
      {
        categorie: "import",
        source: "FetchHttpClient",
        nomDuFichier: body.nomDuFichier,
      },
      "Validation du fichier par Validata terminée",
    );

    return {
      ...result.report,
      resource_data: result.resource_data,
    };
  }
}
