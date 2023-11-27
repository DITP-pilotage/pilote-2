import { NextApiRequest, NextApiResponse } from 'next';
import handleImportMasseMetadataIndicateur
  from '@/server/parametrage-indicateur/infrastructure/handlers/ImportMasseMetadataIndicateurHandler';


export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handle(request: NextApiRequest, response: NextApiResponse) {
  return handleImportMasseMetadataIndicateur(request, response);
}
