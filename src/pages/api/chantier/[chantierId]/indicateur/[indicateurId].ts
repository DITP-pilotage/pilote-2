import { NextApiRequest, NextApiResponse } from 'next';

import handleValiderFichierImportIndicateur
  from '@/server/import-indicateur/infrastructure/handlers/import-indicateur.handler';


export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleValiderFichierImportIndicateur(req, res);
}
