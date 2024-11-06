import { NextApiRequest, NextApiResponse } from 'next';

import { getContainer } from '@/server/dependances';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return getContainer('importIndicateur').resolve('publierFichierImportIndicateurHandler').handle(req, res);
}
