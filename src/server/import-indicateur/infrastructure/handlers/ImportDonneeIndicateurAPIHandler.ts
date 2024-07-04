import { stringify } from 'csv-stringify/sync';
import { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'formidable';
import { join } from 'node:path';
import fs from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  DataImportDonneeIndicateurAPIContrat,
  ImportDonneeIndicateurAPIContrat,
} from '@/server/import-indicateur/app/contrats/DataImportDonneeIndicateurAPIContrat';
import { parseForm } from '@/server/import-indicateur/infrastructure/handlers/ParseForm';

function convertirEnTableauPourCSV(donnees: ImportDonneeIndicateurAPIContrat[]) {
  return donnees.map(donnee => ([
    donnee.identifiant_indic,
    donnee.zone_id,
    donnee.zone_nom,
    donnee.date_valeur,
    donnee.type_valeur,
    donnee.valeur,
  ]));
}
const baseSchemaUrl = 'https://raw.githubusercontent.com/DITP-pilotage/pilote-2/main/public/schema/';

const importDonneeIndicateur = async ({
  response,
  cheminCompletDuFichier,
  nomDuFichier,
  indicateurId,
  utilisateurAuteurDeLimportEmail,
  isAdmin,
}: {
  response: NextApiResponse,
  cheminCompletDuFichier: string,
  nomDuFichier: string,
  indicateurId: string,
  utilisateurAuteurDeLimportEmail: string,
  isAdmin: boolean,
}) => {
  const report = await dependencies.getVerifierFichierIndicateurImporteUseCase().execute(
    {
      cheminCompletDuFichier,
      nomDuFichier,
      baseSchemaUrl,
      indicateurId,
      utilisateurAuteurDeLimportEmail,
      isAdmin,
    },
  );
  if (report.estValide) {
    const publierFichierIndicateurImporteUseCase = dependencies.getPublierFichierIndicateurImporteUseCase();
    await publierFichierIndicateurImporteUseCase.execute(
      {
        rapportId: report.id,
      },
    );
    response.status(200).json({
      message: 'Les données ont correctement été importés',
    });
  } else {
    response.status(400).json({
      message: "Une erreur est survenue lors de l'import des données",
      erreurs: report.listeErreursValidation.map(erreur => ({
        cellule: erreur.cellule,
        nomDuChamp: erreur.nomDuChamp,
        message: erreur.message,
      })),
    });
  }
};

export const handleImportDonneeIndicateurAPI = async ({ request, response, email, profil }: { request: NextApiRequest, response: NextApiResponse, email: string, profil: string }) => {
  const contentType = request.headers['content-type'];
  if (contentType?.startsWith('application/json')) {
    const readable = request.read();

    const buffer = Buffer.from(readable);
    try {
      const data = JSON.parse(buffer.toString()) as DataImportDonneeIndicateurAPIContrat;
      const stringifier = stringify(
        convertirEnTableauPourCSV(data.donnees), {
          header: true,
          columns: ['identifiant_indic', 'zone_id', 'zone_nom', 'date_valeur', 'type_valeur', 'valeur'],
        });
      const uploadDir = join(
        process.env.ROOT_DIR || process.cwd(),
        '/uploads',
      );

      const fileName = `import-local-json-${(new Date()).toISOString()}.csv`;
      const filePath = `${uploadDir}/${fileName}`;
      await new Promise<void>(async (resolve, reject) => {
        try {
          await stat(uploadDir);
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            await mkdir(uploadDir, { recursive: true });
          } else {
            reject(error);
            return;
          }
        }
        fs.writeFile(filePath, Buffer.from(stringifier), async (err) => {
          if (err) {
            reject(err);
          }

          await importDonneeIndicateur({
            cheminCompletDuFichier: filePath,
            nomDuFichier: fileName,
            indicateurId: request.query.indicateurId as string,
            utilisateurAuteurDeLimportEmail: email,
            isAdmin: profil === 'DITP_ADMIN',
            response,
          });

          resolve();
        });
      });
    } catch (error) {
      return response.status(400).json({ message: (error as Error).message });
    }
  }
  if (contentType?.startsWith('multipart/form-data')) {
    const formData = await parseForm(request);
    const fichier = <File>formData.file![0];
    await importDonneeIndicateur({
      cheminCompletDuFichier: fichier.filepath,
      nomDuFichier: fichier.originalFilename as string,
      indicateurId: request.query.indicateurId as string,
      utilisateurAuteurDeLimportEmail: email,
      isAdmin: profil === 'DITP_ADMIN',
      response,
    });
  }
};
