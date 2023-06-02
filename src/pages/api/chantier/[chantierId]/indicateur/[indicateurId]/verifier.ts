import { NextApiRequest, NextApiResponse } from 'next';

import handleVerifierFichierImportIndicateur
  from '@/server/import-indicateur/infrastructure/handlers/VerifierImportIndicateurHandler';


export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleVerifierFichierImportIndicateur(req, res);
}
