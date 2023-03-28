import { NextApiRequest, NextApiResponse } from 'next';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default async function handleValiderFichierImportIndicateur(
  request: NextApiRequest,
  response: NextApiResponse,
  validerFichierIndicateurImporteUseCase = dependencies.getValiderFichierIndicateurImporteUseCase(),
) {

  await validerFichierIndicateurImporteUseCase.execute(
    {
      formDataBody: request.body,
      contentType: request.headers['content-type']?.toString() as string,
    },
  );

  response.status(200).json({});
}
