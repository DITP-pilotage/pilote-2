import { NextApiRequest, NextApiResponse } from 'next';
import { getContainer } from '@/server/dependances';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return getContainer('importIndicateur').resolve('verifierFichierImportIndicateurHandler').handle(req, res);
}
