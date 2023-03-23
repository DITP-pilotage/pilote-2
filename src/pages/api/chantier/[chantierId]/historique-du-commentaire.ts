import { NextApiRequest, NextApiResponse } from 'next';

import handleChantierIdHistoriqueDuCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/historiqueDuChantier';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handleChantierIdHistoriqueDuCommentaire(req, res);
}
