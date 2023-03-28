import { NextApiRequest, NextApiResponse } from 'next';

import handleCréerCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/commentaire';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleCréerCommentaire(req, res);
}
