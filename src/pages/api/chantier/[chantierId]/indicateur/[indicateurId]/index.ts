import { NextApiRequest, NextApiResponse } from 'next';

import handlePublierFichierImportIndicateur
  from '@/server/import-indicateur/infrastructure/handlers/PublierIndicateurHandler';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handlePublierFichierImportIndicateur(req, res);
}
