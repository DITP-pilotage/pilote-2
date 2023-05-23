import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default async function handlePublierFichierImportIndicateur(
  request: NextApiRequest,
  response: NextApiResponse,
  publierFichierIndicateurImporteUseCase = dependencies.getPublierFichierIndicateurImporteUseCase(),
) {

  await publierFichierIndicateurImporteUseCase.execute(
    {
      rapportId: request.query.rapportId as string,
    },
  );

  response.status(200).json({});
}
