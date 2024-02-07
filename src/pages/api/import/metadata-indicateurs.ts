import { NextApiRequest, NextApiResponse } from 'next';
import handleImportMasseMetadataIndicateur
  from '@/server/parametrage-indicateur/infrastructure/handlers/ImportMasseMetadataIndicateurHandler';


export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handle(request: NextApiRequest, response: NextApiResponse) {
  await handleImportMasseMetadataIndicateur(request, response);

  response.status(200).json({});
}
