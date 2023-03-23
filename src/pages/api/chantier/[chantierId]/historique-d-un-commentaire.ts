import { NextApiRequest, NextApiResponse } from 'next';

import handleHistoriqueDUnCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/historiqueDUnCommentaire';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleHistoriqueDUnCommentaire(req, res);
}
