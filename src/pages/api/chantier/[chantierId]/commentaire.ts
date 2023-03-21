import { NextApiRequest, NextApiResponse } from 'next';

import handlePostCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/commentaire';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handlePostCommentaire(req, res);
}
