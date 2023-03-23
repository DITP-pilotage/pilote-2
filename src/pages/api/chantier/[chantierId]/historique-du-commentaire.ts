import { NextApiRequest, NextApiResponse } from 'next';

import handleHistoriqueDuCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/historiqueDuChantier';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleHistoriqueDuCommentaire(req, res);
}
