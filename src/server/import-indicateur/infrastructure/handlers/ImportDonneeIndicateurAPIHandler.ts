import { stringify } from "csv-stringify/sync";
import { NextApiRequest, NextApiResponse } from "next";
import { File } from "formidable";
import { join } from "node:path";
import fs from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import {
  DataImportDonneeIndicateurAPIContrat,
  ImportDonneeIndicateurAPIContrat,
} from "@/server/import-indicateur/app/contrats/DataImportDonneeIndicateurAPIContrat";
import { parseForm } from "@/server/import-indicateur/infrastructure/handlers/ParseForm";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { PublierFichierIndicateurImporteUseCase } from "@/server/import-indicateur/usecases/PublierFichierIndicateurImporteUseCase";
import { VerifierFichierIndicateurImporteUseCase } from "@/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase";
import { isENOENTError } from "@/server/utils/errors";
import logger from "@/server/infrastructure/Logger";

function convertirEnTableauPourCSV(
  donnees: ImportDonneeIndicateurAPIContrat[],
) {
  return donnees.map((donnee) => [
    donnee.identifiant_indic,
    donnee.zone_id,
    donnee.zone_nom,
    donnee.date_valeur,
    donnee.type_valeur,
    donnee.valeur,
  ]);
}
const baseSchemaUrl =
  "https://raw.githubusercontent.com/DITP-pilotage/pilote-2/main/public/schema/";

export class ImportDonneeIndicateurAPIHandler {
  private publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase;

  private verifierFichierIndicateurImporteUseCase: VerifierFichierIndicateurImporteUseCase;

  constructor({
    publierFichierIndicateurImporteUseCase,
    verifierFichierIndicateurImporteUseCase,
  }: {
    publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase;
    verifierFichierIndicateurImporteUseCase: VerifierFichierIndicateurImporteUseCase;
  }) {
    this.publierFichierIndicateurImporteUseCase =
      publierFichierIndicateurImporteUseCase;
    this.verifierFichierIndicateurImporteUseCase =
      verifierFichierIndicateurImporteUseCase;
  }

  async handle({
    request,
    response,
    utilisateurId,
    email,
    profil,
  }: {
    request: NextApiRequest;
    response: NextApiResponse;
    utilisateurId: string;
    email: string;
    profil: string;
  }) {
    const contentType = request.headers["content-type"];
    if (contentType?.startsWith("application/json")) {
      const readable = request.read();

      const buffer = Buffer.from(readable);
      try {
        const data = JSON.parse(
          buffer.toString(),
        ) as DataImportDonneeIndicateurAPIContrat;
        const stringifier = stringify(convertirEnTableauPourCSV(data.donnees), {
          header: true,
          columns: [
            "identifiant_indic",
            "zone_id",
            "zone_nom",
            "date_valeur",
            "type_valeur",
            "valeur",
          ],
        });
        const uploadDir = join(
          process.env.ROOT_DIR || process.cwd(),
          "/uploads",
        );

        const fileName = `import-local-json-${new Date().toISOString()}.csv`;
        const filePath = `${uploadDir}/${fileName}`;
        await new Promise<void>(async (resolve, reject) => {
          try {
            await stat(uploadDir);
          } catch (error) {
            if (isENOENTError(error)) {
              await mkdir(uploadDir, { recursive: true });
            } else {
              reject(error);
              return;
            }
          }
          fs.writeFile(filePath, stringifier, async (err) => {
            if (err) {
              reject(err);
            }

            await this.importDonneeIndicateur({
              cheminCompletDuFichier: filePath,
              nomDuFichier: fileName,
              indicateurId: request.query.indicateurId as string,
              utilisateurAuteurDeLimportEmail: email,
              isAdmin: profil === ProfilEnum.DITP_ADMIN,
              auteurId: utilisateurId,
              response,
            });

            resolve();
          });
        });
      } catch (error) {
        logger.error(
          {
            categorie: "import",
            source: "ImportDonneeIndicateurAPIHandler",
            indicateurId: request.query.indicateurId as string,
            contentType,
          },
          `Erreur traitement import JSON : ${(error as Error).message}`,
        );
        return response.status(400).json({ message: (error as Error).message });
      }
    }
    if (contentType?.startsWith("multipart/form-data")) {
      const formData = await parseForm(request);
      const fichier = <File>formData.file![0];
      await this.importDonneeIndicateur({
        cheminCompletDuFichier: fichier.filepath,
        nomDuFichier: fichier.originalFilename as string,
        indicateurId: request.query.indicateurId as string,
        utilisateurAuteurDeLimportEmail: email,
        isAdmin: profil === ProfilEnum.DITP_ADMIN,
        auteurId: utilisateurId,
        response,
      });
    }
  }

  private importDonneeIndicateur = async ({
    response,
    cheminCompletDuFichier,
    nomDuFichier,
    indicateurId,
    utilisateurAuteurDeLimportEmail,
    isAdmin,
    auteurId,
  }: {
    response: NextApiResponse;
    cheminCompletDuFichier: string;
    nomDuFichier: string;
    indicateurId: string;
    utilisateurAuteurDeLimportEmail: string;
    isAdmin: boolean;
    auteurId: string;
  }) => {
    const report = await this.verifierFichierIndicateurImporteUseCase.execute({
      cheminCompletDuFichier,
      nomDuFichier,
      baseSchemaUrl,
      indicateurId,
      utilisateurAuteurDeLimportEmail,
      isAdmin,
    });

    if (report.estValide) {
      await this.publierFichierIndicateurImporteUseCase.execute({
        rapportId: report.id,
        auteurId,
      });

      response.status(200).json({
        message: "Les données ont correctement été importés",
      });
    } else {
      response.status(400).json({
        message: "Une erreur est survenue lors de l'import des données",
        erreurs: report.listeErreursValidation.map((erreur) => ({
          cellule: erreur.cellule,
          nomDuChamp: erreur.nomDuChamp,
          message: erreur.message,
        })),
      });
    }
  };
}
