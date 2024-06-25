import { stringify } from 'csv-stringify/sync';
import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'node:path';
import fs from 'node:fs';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  DataImportDonneeIndicateurAPIContrat,
  ImportDonneeIndicateurAPIContrat,
} from '@/server/import-indicateur/app/contrats/DataImportDonneeIndicateurAPIContrat';

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

      const fileName = `foo-${(new Date()).toISOString()}.csv`;
      const filePath = `${uploadDir}/${fileName}`;
      fs.writeFile(filePath, Buffer.from(stringifier), async (err) => {
        if (err) {
          throw err;
        }
        const baseSchemaUrl = 'https://raw.githubusercontent.com/DITP-pilotage/pilote-2/main/public/schema/';

        const report = await dependencies.getVerifierFichierIndicateurImporteUseCase().execute(
          {
            cheminCompletDuFichier: filePath,
            nomDuFichier: fileName,
            baseSchemaUrl,
            indicateurId: request.query.indicateurId as string,
            utilisateurAuteurDeLimportEmail: email,
            isAdmin: profil === 'DITP_ADMIN',
          },
        );
        if (report.estValide) {
          const publierFichierIndicateurImporteUseCase = dependencies.getPublierFichierIndicateurImporteUseCase();
          await publierFichierIndicateurImporteUseCase.execute(
            {
              rapportId: report.id,
            },
          );
        }
      });
      return response.status(200).json(data);
    } catch (error) {
      return response.status(400).json({ message: (error as Error).message });
    }
  }
  if (contentType?.startsWith('multipart/form-data')) {

    /*
    const formData = await parseForm(request);
    const fichier = <File>formData.file![0];
     */
  }
};
