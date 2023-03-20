import { NextApiRequest, NextApiResponse } from 'next';

import handleImportIndicateur from '@/server/infrastructure/api/chantier/[chantierId]/indicateur/[indicateurId]';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleImportIndicateur(req, res);
}
