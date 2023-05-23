import { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'formidable';
import { decode } from 'next-auth/jwt';
import assert from 'node:assert/strict';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import { parseForm } from '@/server/import-indicateur/infrastructure/handlers/ParseForm';
import configuration from '@/server/infrastructure/Configuration';

const présenterEnContrat = (report: DetailValidationFichier): DetailValidationFichierContrat => {
  return {
    estValide: report.estValide,
    listeErreursValidation: report.listeErreursValidation.map(erreur => ({
      cellule: erreur.cellule,
      nom: erreur.nom,
      message: erreur.message,
      numeroDeLigne: erreur.numeroDeLigne,
      positionDeLigne: erreur.positionDeLigne,
      nomDuChamp: erreur.nomDuChamp,
      positionDuChamp: erreur.positionDuChamp,
    })),
  };
};

export default async function handleValiderFichierImportIndicateur(
  request: NextApiRequest,
  response: NextApiResponse,
  validerFichierIndicateurImporteUseCase = dependencies.getValiderFichierIndicateurImporteUseCase(),
) {

  const formData = await parseForm(request);

  const fichier = <File>formData.file;

  const schéma = 'https://raw.githubusercontent.com/DITP-pilotage/pilote-2/main/public/schema/sans-contraintes.json';
  const sessionToken = request.cookies['next-auth.session-token'];

  const decoded = await decode({
    token: sessionToken,
    secret: configuration.nextAuthSecret,
  });

  assert(decoded?.user);

  const report = await validerFichierIndicateurImporteUseCase.execute(
    {
      cheminCompletDuFichier: fichier.filepath,
      nomDuFichier: fichier.originalFilename as string,
      schema: schéma,
      indicateurId: request.query.indicateurId as string,
      utilisateurAuteurDeLimportEmail: (decoded.user as { email: string }).email,
    },
  );

  response.status(200).json(présenterEnContrat(report));
}
