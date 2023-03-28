import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';

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

  const report = await validerFichierIndicateurImporteUseCase.execute(
    {
      formDataBody: request.body,
      contentType: request.headers['content-type']?.toString() as string,
    },
  );

  response.status(200).json(présenterEnContrat(report));
}
