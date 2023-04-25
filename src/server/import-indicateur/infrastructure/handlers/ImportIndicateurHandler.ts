import { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'formidable';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import { parseForm } from '@/server/import-indicateur/infrastructure/handlers/ParseForm';
import { DetailValidationFichier } from '@/server/domain/fichier/DetailValidationFichier';

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

  const schéma = 'https://raw.githubusercontent.com/DITP-pilotage/poc-imports/master/schemas/templates/indicateur/sans-contraintes/schema_pilote_sans_contraintes.json';

  const report = await validerFichierIndicateurImporteUseCase.execute(
    {
      cheminCompletDuFichier: fichier.filepath,
      nomDuFichier: fichier.originalFilename as string,
      schema: schéma,
      indicateurId: request.query.indicateurId as string,
    },
  );

  response.status(200).json(présenterEnContrat(report));
}
