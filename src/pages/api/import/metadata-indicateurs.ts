import { NextApiRequest, NextApiResponse } from 'next';
import handleImportMasseMetadataIndicateur
  from '@/server/parametrage-indicateur/infrastructure/handlers/ImportMasseMetadataIndicateurHandler';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handle(request: NextApiRequest, response: NextApiResponse) {

  await handleImportMasseMetadataIndicateur(request, response).then(() => {
    response.status(200).json({});
  }).catch(error => {
    response.status(500).json({
      message: error.message,
    });
  });
}
