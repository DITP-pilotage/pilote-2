import { NextApiRequest, NextApiResponse } from 'next';

import handleValiderFichierImportIndicateur
  from '@/server/import-indicateur/infrastructure/handlers/ImportIndicateurHandler';


export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleValiderFichierImportIndicateur(req, res);
}
