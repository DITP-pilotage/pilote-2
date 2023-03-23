import { NextApiRequest, NextApiResponse } from 'next';

import handlePublierCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/commentaire';

export default function handle(req: NextApiRequest, res: NextApiResponse) {
  return handlePublierCommentaire(req, res);
}
